import { decodeEnsDomain } from "@/utils/decodeEnsDomain";
import { resolverAbi } from "@/utils/resolverAbi";
import { createWalletClient, decodeAbiParameters, decodeFunctionData, encodeAbiParameters, encodePacked, http, isHex, keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export async function GET(req: Request, res: Response) {
  
  const path = req.url.split('/');

  const resolver = path[4];
  if (resolver !== '0x0eB8b476B2d346537f302E99419b215d191A7EFa') {
    return Response.json({ error: 'Invalid resolver' }, { status: 400 });  
  }

  const data = path[5].replace('.json', '');
  if (isHex(data) === false) {
    return Response.json({ error: 'Invalid data' }, { status: 400 });
  }

  console.log('data:',data);
  const slicedData = `0x${data.slice(10)}` as `0x${string}`;
  console.log('slicedData:',slicedData);
  const [encodedEnsDomain, transactionData] = decodeAbiParameters([
    { name: 'bytes', type: 'bytes' },
    { name: 'bytes2', type: 'bytes' },
  ], slicedData);

  console.log('encodedEnsDomain:',encodedEnsDomain);
  console.log('transactionData:',transactionData);

  const decodedEnsDomain = decodeEnsDomain(encodedEnsDomain);

  console.log('decodedEnsDomain:',decodedEnsDomain);

  const match = decodedEnsDomain.match(`^(?<username>[^.]+)\\.?(?<domain>fname\\.?(?:eth))$`);
  if (match === null) {
    return Response.json({ error: 'Invalid ENS domain' }, { status: 400 });
  }

  console.log('match:',match);

  const { username } = match.groups as { domain: string, username: string };

  console.log('username:',username);

  const { functionName, args } = decodeFunctionData({
    abi: resolverAbi,
    data: transactionData,
  })  

  if (functionName !== 'addr' && args && args.length !== 1) {
    return Response.json({ error: 'Unsupported function' }, { status: 400 });
  }

  // Fetch the address corresponding to the username
  const options = {
    method: 'GET',
    headers: {accept: 'application/json', api_key: 'NEYNAR_API_DOCS'}
  };

  const userData = await fetch(`https://api.neynar.com/v1/farcaster/user-by-username?username=${username}`, options)

  if (!userData.ok) {
    console.error(`Failed to fetch user: ${username} // ${userData.status} // ${userData}`);
    return Response.json({ error: 'Failed to fetch user' }, { status: 400 });
  }
  
  const userDataJson = await userData.json();
  console.log('userDataJson:',userDataJson);

  const address = userDataJson.result.user.verifiedAddresses.eth_addresses[0];
  console.log('address:',address);

  const rawResponse = {
    address,
    validUntil: Math.floor(Date.now() / 1000) + 100,
  }

  console.log('rawResponse:',rawResponse);

  const hashedResponse = keccak256(encodePacked(
    ['bytes', 'address', 'uint64', 'bytes32', 'bytes32'],
    [
      '0x1900',
      resolver,
      BigInt(rawResponse.validUntil),
      keccak256(data),
      keccak256(rawResponse.address),
    ],
  ))

  console.log('hashedResponse:',hashedResponse);
  const hashedResponseBytes = toBytes(hashedResponse);
  
  const account = privateKeyToAccount(process.env.SIGNER_PRIVATE_KEY as `0x${string}`);
  const client = createWalletClient({
    account,
    transport: http(process.env.TRANSPORT_URL as string),
  });
  const signature = await client.signMessage({
    message: {
      raw: hashedResponseBytes,
    }
  });

  const response = encodeAbiParameters([
      { type: 'bytes' },
      { type: 'uint64' },
      { type: 'bytes' },
    ],
    [
      rawResponse.address, 
      BigInt(rawResponse.validUntil), 
      signature
  ])

  return Response.json({
    data: response,
  }, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });

}
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

  const decodedEnsDomain = decodeEnsDomain(encodedEnsDomain);

  const match = decodedEnsDomain.match(`^(?<username>[^.]+)\\.?(?<domain>fname\\.?(?:eth))$`);
  if (match === null) {
    return Response.json({ error: 'Invalid ENS domain' }, { status: 400 });
  }

  const { username } = match.groups as { domain: string, username: string };

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
    return Response.json({ error: 'Failed to fetch user' }, { status: 400 });
  }
  
  const userDataJson = await userData.json();

  const address = userDataJson.result.user.verifiedAddresses.eth_addresses[0];

  const rawResponse = {
    address,
    validUntil: Math.floor(Date.now() / 1000) + 100,
  }

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

  console.log('address:',rawResponse.address)
  console.log('signature:',signature)
  console.log('validUntil:',rawResponse.validUntil)

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

  console.log('response:',response);
  return Response.json({
    data: response,
  }, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });

}
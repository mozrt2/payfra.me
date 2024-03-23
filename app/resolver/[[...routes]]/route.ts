import { decodeEnsDomain } from "@/utils/decodeEnsDomain";
import { resolverAbi } from "@/utils/resolverAbi";
import * as secp from '@noble/secp256k1';
import { decodeAbiParameters, decodeFunctionData, encodeAbiParameters, encodeFunctionResult, encodePacked, fromBytes, isHex, keccak256, toBytes } from "viem";

export async function GET(req: Request, res: Response) {
  
  const path = req.url.split('/');

  const resolver = path[4];
  if (resolver !== '0x0eB8b476B2d346537f302E99419b215d191A7EFa') {
    console.error('Invalid resolver:', resolver);
    return Response.json({ error: 'Invalid resolver' }, { status: 400 });  
  }

  const data = path[5].replace('.json', '');
  if (isHex(data) === false) {
    console.error('Invalid data:', data); 
    return Response.json({ error: 'Invalid data' }, { status: 400 });
  }

  const slicedData = `0x${data.slice(10)}` as `0x${string}`;
  const [encodedEnsDomain, transactionData] = decodeAbiParameters([
    { name: 'bytes', type: 'bytes' },
    { name: 'bytes2', type: 'bytes' },
  ], slicedData);

  const decodedEnsDomain = decodeEnsDomain(encodedEnsDomain);

  const match = decodedEnsDomain.match(`^(?<username>[^.]+)\\.?(?<domain>fname\\.?(?:eth))$`);
  if (match === null) {
    console.error('Invalid ENS domain:', decodedEnsDomain);
    return Response.json({ error: 'Invalid ENS domain' }, { status: 400 });
  }

  const { username } = match.groups as { domain: string, username: string };

  const { functionName, args } = decodeFunctionData({
    abi: resolverAbi,
    data: transactionData,
  })  

  if (functionName !== 'addr' && functionName !== 'text') {
    console.error('Unsupported function:', functionName, args, transactionData);
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

  let result: `0x${string}` = '0x';

  if (functionName === 'addr') {
    const address = userDataJson.result.user.verifiedAddresses.eth_addresses[0];
    result = encodeFunctionResult({
      abi: resolverAbi.filter(i => i.name === 'addr' && i.inputs.length === 1),
      functionName,
      result: address,
    });
  } else if (functionName === 'text' && args) {
    console.log('args:', args);
    const key = args[1];
    let record = '';
    switch (key) {
      case 'name':
        record = userDataJson.result.user.displayName;
        break;
      case 'description':
        record = userDataJson.result.user.profile.description;
        break;
      case 'avatar':
        record = userDataJson.result.user.pfp.url;
        break;
      default:
        return Response.json({ error: 'Record type not supported' }, { status: 400 });
    }
    console.log('record:', record);
    result = encodeFunctionResult({
      abi: resolverAbi,
      functionName,
      result: record,
    })
  }

  const rawResponse = {
    result,
    validUntil: Math.floor(Date.now() / 1000) + 100,
  }

  const hashedResponse = keccak256(encodePacked(
    ['bytes', 'address', 'uint64', 'bytes32', 'bytes32'],
    [
      '0x1900',
      resolver,
      BigInt(rawResponse.validUntil),
      keccak256(data),
      keccak256(rawResponse.result),
    ],
  ))
  const hashedResponseBytes = toBytes(hashedResponse);
  
  const privateKeyBytes = toBytes(process.env.SIGNER_PRIVATE_KEY as `0x${string}`);

  const signatureBytes = await secp.sign(hashedResponseBytes, privateKeyBytes, {
    der: false,
    canonical: true,
    recovered: true,
  });
  const recoveryId = 27 + signatureBytes[1];
  const completeSignature = new Uint8Array([...Array.from(signatureBytes[0]), recoveryId]);
  const signature = fromBytes(completeSignature, 'hex');

  const response = encodeAbiParameters([
      { type: 'bytes' },
      { type: 'uint64' },
      { type: 'bytes' },
    ],
    [
      rawResponse.result, 
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
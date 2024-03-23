import { decodeEnsDomain } from "@/utils/decodeEnsDomain";
import { resolverAbi } from "@/utils/resolverAbi";
import { decodeAbiParameters, decodeFunctionData, isHex } from "viem";

export async function GET(req: Request) {

  const path = req.url.split('/');

  const resolver = path[2];
  if (resolver !== '0x0eB8b476B2d346537f302E99419b215d191A7EFa') {
    return Response.json({ error: 'Invalid resolver' });  
  }

  const data = path[3].replace('.json', '');
  if (isHex(data) === false) {
    return Response.json({ error: 'Invalid data' });
  }

  const [encodedEnsDomain, transactionData] = decodeAbiParameters([
    { name: 'bytes', type: 'bytes' },
    { name: 'bytes2', type: 'bytes' },
  ], `0x${data.slice(10)}`);

  const decodedEnsDomain = decodeEnsDomain(encodedEnsDomain);

  const username = decodedEnsDomain.match(/^(.*?)\.fname\.eth$/);
  if (username === null) {
    return Response.json({ error: 'Invalid ENS domain' });
  }

  const { functionName, args } = decodeFunctionData({
    abi: resolverAbi,
    data: transactionData,
  })  

  if (functionName !== 'addr' && args && args.length !== 1) {
    return Response.json({ error: 'Unsupported function' });
  }

  // Fetch the address corresponding to the username
  const options = {
    method: 'GET',
    headers: {accept: 'application/json', api_key: 'NEYNAR_API_DOCS'}
  };

  const response = await fetch(`https://api.neynar.com/v1/farcaster/user-by-username?username=${username}`, options)

  if (!response.ok) {
    console.log(response)
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data2 = await response.json();

  return Response.json({ address: data2.result.user.verifiedAddresses.eth_addresses[0] });
}
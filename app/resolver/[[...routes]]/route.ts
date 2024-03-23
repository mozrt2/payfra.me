import { isHex } from "viem";

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

  const options = {
    method: 'GET',
    headers: {accept: 'application/json', api_key: 'NEYNAR_API_DOCS'}
  };

  const response = await fetch('https://api.neynar.com/v1/farcaster/user-by-username?username=moritz&viewerFid=3', options)

  if (!response.ok) {
    console.log(response)
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data2 = await response.json();

  return Response.json({ address: data2.result.user.verifiedAddresses.eth_addresses[0] });
}
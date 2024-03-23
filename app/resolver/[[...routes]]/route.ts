export async function GET() {

  const options = {
    method: 'GET',
    headers: {accept: 'application/json', api_key: 'NEYNAR_API_DOCS'}
  };

  const response = await fetch('https://api.neynar.com/v1/farcaster/user-by-username?username=moritz&viewerFid=3', options)

  if (!response.ok) {
    console.log(response)
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  return Response.json({ address: data.result.user.verifiedAddresses.eth_addresses[0] });
}
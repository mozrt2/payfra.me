export async function GET(req: Request, res: Response) {
  const username = "moritz"
  const options = {
    method: 'GET',
    headers: {accept: 'application/json', api_key: process.env.NEYNAR_API_KEY as string}
  };

  const userData = await fetch(`https://api.neynar.com/v1/farcaster/user-by-username?username=${username}`, options)

  const userDataJson = await userData.json();

  return Response.json({
    data: userDataJson,
  }, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });

}
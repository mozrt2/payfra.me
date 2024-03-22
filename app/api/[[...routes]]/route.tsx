/** @jsxImportSource frog/jsx */

import { createConfig, getEnsAddress, http } from '@wagmi/core';
import { mainnet } from '@wagmi/core/chains';
import { Button, Frog } from 'frog';
import { devtools } from 'frog/dev';
import { neynar } from 'frog/hubs';
import { handle } from 'frog/next';
import { serveStatic } from 'frog/serve-static';

const apiKey = process.env.NEYNAR_API_KEY as string

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  }
})

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  hub: neynar({ apiKey })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

app.frame('/pay/:ens', async (c) => {
  const ens = c.req.param('ens')
  const address = await getEnsAddress(wagmiConfig, { 
    name: ens,
  })
  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background:'linear-gradient(to bottom right, #19719A, #002E00)',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {`Pay ${ens}`}
        </div>
      </div>
    ),
    intents: [
      <Button.Transaction target={`/send/${address}`}>Pay 💸</Button.Transaction>,
    ],
  })
})

app.transaction('/send/:address', async c => {
  const address = c.req.param('address')
  return c.send({
    chainId: 'eip155:10',
    to: address as `0x${string}`,
  });
});

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)

/** @jsxImportSource frog/jsx */

import { createConfig, getEnsAddress, http } from '@wagmi/core';
import { mainnet } from '@wagmi/core/chains';
import { Button, Frog, TextInput } from 'frog';
import { devtools } from 'frog/dev';
import { handle } from 'frog/next';
import { serveStatic } from 'frog/serve-static';
import { parseUnits } from 'viem';

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
  // hub: neynar({ apiKey })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

const image = (ens: string, amount: string, token: string, chain: string) => (
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
      {`Send${amount} ${token}to ${ens} on ${chain}`}
    </div>
  </div>
)

// Frame with ENS only
app.frame('/pay/:ens', async (c) => {
  const { ens } = c.req.param()
  const isFkey = ens.includes('fkey')
  const lastToken = isFkey ? 'USDT' : 'DEGEN'
  const chain = isFkey ? 'Optimism 🔴' : 'Base 🔵'
  const address = await getEnsAddress(wagmiConfig, { 
    name: ens as string,
  })
  return c.res({
    image: image(ens as string, "", "", chain),
    intents: [
      <TextInput placeholder='Amount' />,
      <Button.Transaction target={`/send/${ens}/${address}/ETH`}>ETH</Button.Transaction>,
      <Button.Transaction target={`/send/${ens}/${address}/USDC`}>USDC</Button.Transaction>,
      <Button.Transaction target={`/send/${ens}/${address}/DAI`}>DAI</Button.Transaction>,
      <Button.Transaction target={`/send/${ens}/${address}/${lastToken}`}>{lastToken}</Button.Transaction>,
    ],
  })
})

app.transaction('/send/:address', async c => {
  const { inputText } = c
  const address = c.req.param('address')
  return c.send({
    chainId: 'eip155:8453',
    to: address as `0x${string}`,
    value: parseUnits(inputText as string, 18),
  });
});


devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)

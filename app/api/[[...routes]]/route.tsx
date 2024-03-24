/** @jsxImportSource frog/jsx */

import { createConfig, getEnsAddress, http } from '@wagmi/core';
import { mainnet } from '@wagmi/core/chains';
import { Button, Frog, TextInput } from 'frog';
import { neynar } from 'frog/hubs';
import { handle } from 'frog/next';
import { erc20Abi, parseUnits } from 'viem';
interface Token {
  address: `0x${string}`;
  decimals: number;
}

interface Chain {
  [token: string]: Token;
}

interface Tokens {
  [chain: string]: Chain;
}

const tokens: Tokens = {
  optimism: {
    USDC: {
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      decimals: 6,
    },
    DAI: {
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      decimals: 18,
    },
    USDT: {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      decimals: 6,
    },
  },
  base: {
    USDC: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
    },
    DAI: {
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      decimals: 18,
    },
    DEGEN: {
      address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
      decimals: 18,
    },
  },
}

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  }
})

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  hub: neynar({ apiKey: process.env.NEYNAR_API_KEY as string})
})

const image = (ens: string, chain: string, amount: string, token: string) => (
  <div
    style={{
      alignItems: 'center',
      background:'linear-gradient(to bottom right, #0F445C, #002E00)',
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
      {`Pay ${amount !== "undefined" ? amount+" "+token.toUpperCase()+" to "+ens+"\n" : ens+" "}on ${chain}`}
    </div>
  </div>
)

// Frame with ENS only
app.frame('/pay/:ens/:chain/:amount/:token', async (c) => {
  const { ens, chain, amount, token } = c.req.param()
  const isFarcasterUser = !ens.includes('.')
  const finalEns = isFarcasterUser ? `${ens}.fname.eth` : ens
  const isOp = chain === 'op'
  console.log('finalEns:', finalEns)
  const address = await getEnsAddress(wagmiConfig, { 
    name: finalEns as string,
  })
  return c.res({
    image: image(ens as string, isOp ? 'Optimism 🔴' : 'Base 🔵', amount, token),
    intents: [
      amount === "undefined" ? 
        <TextInput placeholder='Amount' /> : null,
      ['eth', 'undefined'].includes(token) ?
        <Button.Transaction 
          target={`/api/send/${address}/ETH/${isOp}/${amount}`}
        >
          ETH
        </Button.Transaction> : null,
      ['usdc', 'undefined'].includes(token) ?
        <Button.Transaction 
          target={`/api/send/${address}/USDC/${isOp}/${amount}`}
        >
          USDC
        </Button.Transaction> : null,
      ['dai', 'undefined'].includes(token) ?
        <Button.Transaction 
          target={`/api/send/${address}/DAI/${isOp}/${amount}`}
        > 
          DAI
        </Button.Transaction> : null,
      ['usdt', 'degen', 'undefined'].includes(token) ?
      <Button.Transaction 
        target={`/api/send/${address}/${isOp ? 'USDT' : 'DEGEN'}/${isOp}/${amount}`}
      >
        {isOp ? 'USDT' : 'DEGEN'}
      </Button.Transaction> : null,
    ],
  })
})

app.transaction('/send/:address/:token/:isOp/:amount', async c => {
  const { inputText } = c
  const { address, token, isOp, amount } = c.req.param()
  const finalAmount = amount === 'undefined' ? inputText : amount
  if (token === '0x0000000000000000000000000000000000000000') {
    return c.send({
      chainId: isOp ? 'eip155:10' : 'eip155:8453',
      to: address as `0x${string}`,
      value: parseUnits(finalAmount as string, 18),
    });
  } else {
    return c.contract({
      abi: erc20Abi,
      chainId: isOp ? 'eip155:10' : 'eip155:8453',
      functionName: 'transfer',
      args: [
        address as `0x${string}`, 
        parseUnits(finalAmount as string, tokens[isOp ? 'optimism' : 'base'][token].decimals)
      ],
      to: tokens[isOp ? 'optimism' : 'base'][token].address,
    });
  }
});

export const GET = handle(app)
export const POST = handle(app)

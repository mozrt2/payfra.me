import { getFrameMetadata } from 'frog/next'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { routes: string[] } }): Promise<Metadata> {
  const routes = params.routes
  let ens = 'moritz'
  let chain = 'base'
  let amount, token
  for (const route of routes) {
    if (route === 'op' || route === 'base') {
      chain = route
      continue
    }
    if (['eth', 'usdc', 'dai', 'usdt', 'degen'].includes(route.toLowerCase())) {
      token = route
      continue
    }
    if (Number(route)) {
      amount = route
      continue
    }
    else {
      if (route.includes('fkey')) {
        chain = 'op'
      }
      ens = route
    }
  }
  const domain = process.env.PROD_URL || 'http://localhost:3000'
  const frameTags = await getFrameMetadata(
    `${domain}/api/pay/${ens}/${chain}/${amount}/${token}`,
  )
  return {
    other: frameTags,
  }
}

export default function Home() {
  return (
    <main>
      <div>
        <h1>💸</h1>
      </div>
    </main>
  )
}

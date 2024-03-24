import { getFrameMetadata } from 'frog/next'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { routes: string[] } }): Promise<Metadata> {
  const ens = params.routes[0]
  const domain = process.env.PROD_URL || 'http://localhost:3000'
  console.log('domain:', domain)
  console.log('ens:', ens)
  const frameTags = await getFrameMetadata(
    `${domain}/api/pay/${ens}`,
  )
  console.log('frameTags:', frameTags)
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

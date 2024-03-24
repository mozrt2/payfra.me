import { getFrameMetadata } from 'frog/next'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { routes: string[] } }): Promise<Metadata> {
  const ens = params.routes[0]
  const frameTags = await getFrameMetadata(
    `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/pay/${ens}`,
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

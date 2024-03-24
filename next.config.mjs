/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'max-age=0',
          },
        ],
      },
    ]
  },
}

export default nextConfig

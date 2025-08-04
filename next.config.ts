import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // reactStrictMode: true,
  // Add other Next.js options you need here

  async headers() {
    // By default, add nothing in development
    if (process.env.NODE_ENV === 'development') {
      return []
    }

    // In production, set secure headers
    return [
      {
        source: '/(.*)', // apply to all routes
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]
  },
}

export default nextConfig

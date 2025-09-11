import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // reactStrictMode: true,
  // Add other Next.js options you need here
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
    domains: ['res.cloudinary.com'],
  },

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
            value: 'same-origin-allow-popups',
          },
          // Avoid setting COEP unless you need SharedArrayBuffer; COEP + COOP blocks OAuth popups
        ],
      },
    ]
  },
}

export default nextConfig

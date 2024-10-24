/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy:path*',
        destination: 'http://localhost:8545/:path*' // Proxy to Backend
      }
    ]
  }
};

export default nextConfig;

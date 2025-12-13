/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable error overlay in development
  devIndicators: {
    buildActivity: false,
  },
}

module.exports = nextConfig


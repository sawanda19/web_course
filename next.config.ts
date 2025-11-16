/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com', 'i.ytimg.com', 'img.youtube.com'],
    unoptimized: true, // Для Render безкоштовного плану
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
  // Пропускаємо TypeScript і ESLint помилки під час build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig

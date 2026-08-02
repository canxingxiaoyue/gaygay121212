/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🌟 NÂNG HẠN MỨC TẢI FILE SERVER ACTIONS TỪ 1MB LÊN 10MB
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverActions: {
    bodySizeLimit: '10mb',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
};

export default nextConfig;
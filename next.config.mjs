/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com', // Cấp phép cho kho ảnh Vercel Blob
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com', // Cấp phép cho các sub-domain kho ảnh
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com', // Cấp phép cho ảnh đại diện Clerk
      },
    ],
  },
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🌟 THÊM ĐOẠN NÀY VÀO ĐỂ CHO PHÉP TẢI FILE TRUYỆN NẶNG TỚI 50MB
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
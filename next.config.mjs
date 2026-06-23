/** @type {import('next').NextConfig} */
const nextConfig = {
  // Thêm cấu hình này để tăng giới hạn kích thước tải ảnh
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // Nâng giới hạn tải lên tối đa là 4MB
    },
  },
};

export default nextConfig;
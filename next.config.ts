import type { NextConfig } from "next";

const nextConfig: NextConfig = {


  // ✅ 嚴格模式開啟，有助於提早發現問題（可選）
  reactStrictMode: true,

  // ✅ 確保圖片載入不報錯（可根據實際網域修改）
  images: {
    domains: ["localhost", "yourcdn.com", "yourbucket.s3.amazonaws.com"],
  },

  // ✅ 可選：忽略 eslint during build (避免 Vercel 報 Lint fail)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ 可選：忽略 type error during build (只在緊急部署時使用)
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// 정적 웹앱으로 내보냅니다. 서버 없이 Vercel·Netlify 등 어디서나 호스팅할 수 있어요.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;

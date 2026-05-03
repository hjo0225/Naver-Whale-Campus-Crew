import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  // dev 모드 우하단 "Static route" 라우트 타입 인디케이터 + 컴파일 활동 표시 끔
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
};

export default config;

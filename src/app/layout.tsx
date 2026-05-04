import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { Toast } from "@/components/ui/Toast";
import { OperatorShortcuts } from "@/components/ui/OperatorShortcuts";

export const metadata: Metadata = {
  title: "HYU NAVER CAMPUS CREW",
  description: "네이버 웨일 캠퍼스크루 부스 게임",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        {children}
        <Toast />
        <OperatorShortcuts />
      </body>
    </html>
  );
}

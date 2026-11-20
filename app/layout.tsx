import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaSetup } from "@/components/PwaSetup";

export const metadata: Metadata = {
  title: "마음이음",
  description: "비슷한 마음을 가진 사람들과 부담 없이 이어지는 곳",
  appleWebApp: { capable: true, title: "마음이음", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAF6EF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <div className="mx-auto min-h-dvh w-full max-w-[480px]">{children}</div>
        <PwaSetup />
      </body>
    </html>
  );
}

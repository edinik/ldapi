import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinuxDo AI 公益站导航",
  description: "记录和展示 LinuxDo 社区 AI 公益站信息",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased [--font-body:Inter,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] [--font-mono:'JetBrains_Mono','SFMono-Regular',Consolas,monospace]">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

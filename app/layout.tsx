import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "抑止線",
  description: "Crisis Cabinet simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

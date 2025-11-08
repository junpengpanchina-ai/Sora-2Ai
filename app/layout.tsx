import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sora-2Ai - AI Video Generation Platform",
  description: "Generate high-quality video content easily with AI technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


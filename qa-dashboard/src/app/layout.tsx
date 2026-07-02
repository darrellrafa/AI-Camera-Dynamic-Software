import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "----font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Camera AI — Dynamic Software | QA Dashboard",
  description:
    "On-premise AI vision quality assurance platform for automotive spare part manufacturing. Real-time defect detection for Scratch, Crack, Dent, and Rust.",
  keywords: [
    "quality assurance",
    "AI vision",
    "defect detection",
    "automotive manufacturing",
    "Camera AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeClient } from "@/components/ThemeClient";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guru Scan",
  description: "Creator-first directory of Whop offers, with clean comparisons and transparent sourcing.",
  icons: {
    icon: [
      { url: "/brand/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/brand/icon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/brand/icon-256.png", sizes: "256x256", type: "image/png" },
    ],
    apple: [{ url: "/brand/icon-256.png", sizes: "256x256", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeClient />
        {children}
      </body>
    </html>
  );
}

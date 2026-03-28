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
  title: {
    default: "Guru Scan — Honest Reviews for Online Gurus & Courses",
    template: "%s | Guru Scan",
  },
  description: "Find honest, independent reviews on online gurus and courses. Compare Whop ratings with real community reviews. See through the hype.",
  metadataBase: new URL("https://guruscan.xyz"),
  openGraph: {
    type: "website",
    siteName: "Guru Scan",
    title: "Guru Scan — Honest Reviews for Online Gurus & Courses",
    description: "Compare Whop ratings with real community reviews. 780+ gurus indexed. See through the hype.",
    url: "https://guruscan.xyz",
    images: [{ url: "/brand/gs-logo-transparent.png", width: 512, height: 512, alt: "Guru Scan" }],
  },
  twitter: {
    card: "summary",
    title: "Guru Scan — Honest Reviews for Online Gurus & Courses",
    description: "Compare Whop ratings with real community reviews. See through the hype.",
    images: ["/brand/gs-logo-transparent.png"],
  },
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

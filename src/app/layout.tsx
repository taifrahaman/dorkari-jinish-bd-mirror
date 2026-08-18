// src/app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans, Atma, Hind_Siliguri } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const atma = Atma({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-atma",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dorkari Jinish BD",
  description: "আপনার প্রয়োজনীয় জিনিসপত্রের বিশ্বস্ত মার্কেটপ্লেস",
};

export const viewport: Viewport = {
  themeColor: "#1E293B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body
        className={`${spaceGrotesk.variable} ${dmSans.variable} ${atma.variable} ${hindSiliguri.variable}`}
      >
        {children}
      </body>
    </html>
  );
}

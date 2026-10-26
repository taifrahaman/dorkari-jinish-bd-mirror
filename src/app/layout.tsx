// src/app/layout.tsx

import type { Metadata, Viewport } from "next";
import {
  Space_Grotesk,
  DM_Sans,
  Atma,
  Hind_Siliguri,
  Geist,
} from "next/font/google";

import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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
  // Replace with your actual production domain when deployed
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://dorkari.com",
  ),
  title: {
    default: "Dorkari Jinish BD",
    template: "%s | Dorkari Jinish BD",
  },
  description: "আপনার প্রয়োজনীয় জিনিসপত্রের বিশ্বস্ত মার্কেটপ্লেস",
  manifest: "/manifest.json",
  keywords: [
    "Dorkari",
    "Jinish",
    "BD",
    "ecommerce",
    "Bangladesh",
    "online shopping",
  ],
  authors: [{ name: "Dorkari Jinish BD" }],
  openGraph: {
    type: "website",
    locale: "bn_BD",
    alternateLocale: "en_US",
    siteName: "Dorkari Jinish BD",
    title: "Dorkari Jinish BD",
    description: "আপনার প্রয়োজনীয় জিনিসপত্রের বিশ্বস্ত মার্কেটপ্লেস",
    // You can add a default image here later:
    // images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dorkari Jinish BD",
    description: "আপনার প্রয়োজনীয় জিনিসপত্রের বিশ্বস্ত মার্কেটপ্লেস",
  },
  robots: {
    index: true,
    follow: true,
  },
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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        className={`${spaceGrotesk.variable} ${dmSans.variable} ${atma.variable} ${hindSiliguri.variable}`}
      >
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

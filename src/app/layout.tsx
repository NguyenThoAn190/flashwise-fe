import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google";
import "./[locale]/globals.css";

// Flashwise dùng Hurme Geometric Sans No2 (font thương mại).
// Không hotlink được file woff2 của họ (403 + bản quyền) nên dùng
// Nunito (Google Fonts, bo tròn geometric, hỗ trợ Vietnamese) làm
// fallback gần nhất, giữ đúng stack: hurme -> Nunito -> Inter -> system.
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-hurme",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Flashwise",
    default: "Flashwise — Flashcards & Learn",
  },
  description: "Study flashcards and learn anything with Flashwise.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/images/logos/logo-icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/images/logos/logo-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/logos/logo-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Flashwise",
  },
  openGraph: {
    images: [{ url: "/images/logos/logo-full-256.png", width: 256, height: 94 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#4255ff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}

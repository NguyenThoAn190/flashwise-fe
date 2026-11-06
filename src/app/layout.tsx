import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google";
import "./[locale]/globals.css";
import { AnalyticsScripts } from "@/components/seo/AnalyticsScripts";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://flashwise.app",
  ),
  title: {
    template: "%s | Flashwise",
    default: "Flashwise — Flashcards & Learn",
  },
  description: "Study flashcards and learn anything with Flashwise.",
  manifest: "/manifest.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
  other: {
    // iOS 16.4+ ưu tiên `mobile-web-app-capable`; `apple-mobile-web-app-capable`
    // (do appleWebApp.capable sinh ra) vẫn cần cho iOS cũ.
    "mobile-web-app-capable": "yes",
    // Không tự động đổi số điện thoại thành link trên iOS.
    "format-detection": "telephone=no",
  },
  openGraph: {
    images: [{ url: "/images/logos/logo-full-256.png", width: 256, height: 94 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#4255ff",
  // viewport-fit=cover: bắt buộc để env(safe-area-inset-*) có giá trị trên
  // iPhone có notch (iOS 11+). Thiếu nó thì safe-area = 0 và app chạy
  // standalone bị header chồn lên Dynamic Island / tai thỏ.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  // Không chặn zoom: iOS Safari tự zoom khi input font < 16px.
  maximumScale: 5,
};

// Capture `beforeinstallprompt` ngay trong <head> (script chạy đồng bộ trước
// khi React bundle eval). Chrome có thể fire event này rất sớm — nếu chỉ
// listen trong useEffect của React thì sẽ miss và banner "lúc hiện lúc không".
const PWA_PROMPT_CAPTURE = `
(function () {
  try {
    window.__fwBeforeInstallPrompt = null;
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      window.__fwBeforeInstallPrompt = e;
      window.dispatchEvent(new CustomEvent("fw:beforeinstallprompt"));
    });
    window.addEventListener("appinstalled", function () {
      window.__fwBeforeInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("fw:appinstalled"));
    });
  } catch (err) {
    /* ignore */
  }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${inter.variable} ${nunito.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PWA_PROMPT_CAPTURE }} />
      </head>
      <body>
        <AnalyticsScripts />
        {children}
      </body>
    </html>
  );
}

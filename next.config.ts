import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withSerwistInit from "@serwist/next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Serwist: sinh /sw.js ở production.
// swSrc là source worker, swDest là file serve từ public.
//
// Mặc định tắt ở dev để tránh cache làm khó debug. Nhưng Chrome chỉ fire
// `beforeinstallprompt` khi đã có service worker đăng ký thành công, nên
// muốn test PWA install ở dev thì bật bằng: PWA_SW_IN_DEV=1 pnpm dev
// (Serwist tự bỏ precache manifest khi dev, chỉ còn runtime cache).
const enableSwInDev = process.env.PWA_SW_IN_DEV === "1";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development" && !enableSwInDev,
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Logo đã có bản resize sẵn (64/128/256) + WebP; Next tự chọn srcset
    // và transcode AVIF/WebP, cache 1 năm cho file immutable (_next/static).
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    deviceSizes: [64, 128, 256, 384],
    imageSizes: [32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        // Trang chủ `/` render theo cookie auth (guest -> landing SSR,
        // maybe-authed -> dashboard skeleton). Báo cho CDN/proxy biết
        // response biến thiên theo Cookie để không phục vụ nhầm bản
        // landing cache cho user đã login (và ngược lại).
        // Bot SEO không gửi cookie nên luôn trúng bản landing đầy đủ.
        source: "/",
        headers: [
          {
            key: "Vary",
            value: "Cookie, Accept-Language",
          },
        ],
      },
      {
        // Home theo locale tiền tố (/en, /vi, ...): layout giữ static để SEO
        // cache tốt; hint auth cho các URL này do client nâng cấp sau
        // hydration (root `/` mới là đường SEO + traffic chính, đã dynamic).
        source: "/:locale",
        headers: [
          {
            key: "Vary",
            value: "Accept-Language",
          },
        ],
      },
      {
        // Logo/favicon trong public/: cache lâu, revalidate ngầm
        source: "/images/logos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/apple-touch-icon.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
  async rewrites() {
    // Browser calls bake NEXT_PUBLIC_API_URL at build time; server-side
    // rewrites inside compose must reach the gateway via docker DNS.
    const apiUrl =
      process.env.GATEWAY_INTERNAL_URL ||
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080/api/v1";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default withSerwist(withNextIntl(nextConfig));

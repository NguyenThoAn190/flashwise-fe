"use client";

import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * GA4 + GTM chỉ chạy ở production khi đã cấu hình ID.
 * Dùng next/script afterInteractive, Consent Mode v2 default denied,
 * chờ banner consent (nếu có) gọi gtag('consent','update',...).
 */
export function AnalyticsScripts() {
  if (process.env.NODE_ENV !== "production") return null;

  return (
    <>
      {GTM_ID ? (
        <>
          <Script id="gtm-consent-default" strategy="beforeInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});`}
          </Script>
          <Script
            id="gtm-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
          />
        </>
      ) : null}
      {GA_ID && !GTM_ID ? (
        <>
          <Script
            id="ga-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied'});gtag('config','${GA_ID}',{send_page_view:true});`}
          </Script>
        </>
      ) : null}
    </>
  );
}

export function trackEvent(action: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const dl = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dl)) {
    dl.push({ event: action, ...params });
  }
}

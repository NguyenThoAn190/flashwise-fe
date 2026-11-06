import React, { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, setRequestLocale } from "next-intl/server";
import { AuthProvider } from "@/lib/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { HomeSwitcher } from "@/components/home/HomeSwitcher";
import { DashboardSkeleton } from "@/components/home/DashboardSkeleton";
import { PWAInstallMount } from "@/components/pwa/PWAInstallMount";
import { getServerAuthHint } from "@/lib/auth/serverAuthHint";

// Route gốc `/` cho locale mặc định (localePrefix: as-needed).
// Middleware của next-intl thương lượng locale từ Accept-Language,
// ở đây đọc locale đã thương lượng rồi render cùng HomeSwitcher
// như trang [locale] để giữ một URL duy nhất cho SEO.
//
// SEO + anti-flicker: đọc cookie auth ở Server. Bot không cookie luôn
// nhận landing SSR đầy đủ; browser có cookie nhận dashboard skeleton
// cùng kích thước thật ngay từ HTML đầu (CLS ~0).
export default async function RootHomePage() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const [messages, authHint] = await Promise.all([
    getMessages(),
    getServerAuthHint(),
  ]);
  const initialHasToken = authHint.hasToken;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider initialHasToken={initialHasToken}>
        <div className="min-h-screen bg-quizlet-canvas flex flex-col selection:bg-quizlet-indigo-light selection:text-quizlet-indigo">
          <Header />
          <main className="flex-1 w-full">
            <Suspense fallback={<DashboardSkeleton />}>
              <HomeSwitcher initialHasToken={initialHasToken} />
            </Suspense>
          </main>
          <PWAInstallMount />
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}

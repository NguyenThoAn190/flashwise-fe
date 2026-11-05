import React, { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, setRequestLocale } from "next-intl/server";
import { AuthProvider } from "@/lib/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { StudySetCardSkeleton } from "@/components/sets";
import { HomeSwitcher } from "@/components/home/HomeSwitcher";
import { PWAInstallMount } from "@/components/pwa/PWAInstallMount";

// Route gốc `/` cho locale mặc định (localePrefix: as-needed).
// Middleware của next-intl thương lượng locale từ Accept-Language,
// ở đây đọc locale đã thương lượng rồi render cùng HomeSwitcher
// như trang [locale] để giữ một URL duy nhất cho SEO.
export default async function RootHomePage() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider>
        <div className="min-h-screen bg-quizlet-canvas flex flex-col selection:bg-quizlet-indigo-light selection:text-quizlet-indigo">
          <Header />
          <main className="flex-1 w-full">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                  <StudySetCardSkeleton count={6} />
                </div>
              }
            >
              <HomeSwitcher />
            </Suspense>
          </main>
          <PWAInstallMount />
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}

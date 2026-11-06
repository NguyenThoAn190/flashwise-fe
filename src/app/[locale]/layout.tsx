import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/context/AuthContext";
import { GoogleAuthProvider } from "@/components/auth/GoogleAuthProvider";
import { PWAInstallMount } from "@/components/pwa/PWAInstallMount";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { homeMetadata } = await import("@/lib/seo/metadata");
  return homeMetadata(hasLocale(routing.locales, locale) ? locale : routing.defaultLocale);
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <GoogleAuthProvider>
        <AuthProvider>
          {children}
          <PWAInstallMount />
        </AuthProvider>
      </GoogleAuthProvider>
    </NextIntlClientProvider>
  );
}

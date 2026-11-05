"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/context/AuthContext";
import { Home, Plus, LibraryBig, Sparkles } from "lucide-react";

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/" || pathname.endsWith("/");
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.includes(href);
}

export function MobileBottomNav() {
  const t = useTranslations("nav");
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Chỉ hiện cho user đã đăng nhập — khách vẫn dùng header + landing như cũ.
  if (!isAuthenticated) return null;

  const homeActive = pathname === "/" || pathname?.endsWith("/");
  const libraryActive = isActivePath(pathname, "/library") && !homeActive;
  const progressActive = isActivePath(pathname, "/progress");
  const createActive = isActivePath(pathname, "/set/create");

  const itemBase =
    "flex items-center justify-center w-11 h-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-95";

  return (
    <nav
      aria-label={t("navMenu")}
      data-testid="mobile-bottom-nav"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden pointer-events-none"
    >
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto max-w-md bg-quizlet-navy rounded-full px-7 py-2 flex items-center justify-between shadow-[0_12px_32px_rgba(10,9,45,0.45)] border border-white/10">
          <Link
            href="/"
            aria-label={t("home")}
            data-testid="mobile-bottom-nav-home"
            className={`${itemBase} ${
              homeActive ? "text-[#8da2ff]" : "text-white/80 hover:text-white"
            }`}
          >
            <Home
              className="w-6 h-6"
              strokeWidth={homeActive ? 2.5 : 2}
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/set/create"
            aria-label={t("createStudySet")}
            data-testid="mobile-bottom-nav-create"
            className={`${itemBase} ${
              createActive ? "text-[#8da2ff]" : "text-white/80 hover:text-white"
            }`}
          >
            <Plus
              className="w-7 h-7"
              strokeWidth={createActive ? 2.5 : 2}
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/library"
            aria-label={t("library")}
            data-testid="mobile-bottom-nav-library"
            className={`${itemBase} ${
              libraryActive ? "text-[#8da2ff]" : "text-white/80 hover:text-white"
            }`}
          >
            <LibraryBig
              className="w-6 h-6"
              strokeWidth={libraryActive ? 2.5 : 2}
              aria-hidden="true"
            />
          </Link>

          <Link
            href="/progress"
            aria-label={t("progress")}
            data-testid="mobile-bottom-nav-progress"
            className={`${itemBase} ${
              progressActive ? "text-[#8da2ff]" : "text-white/80 hover:text-white"
            }`}
          >
            <Sparkles
              className={`w-6 h-6 ${
                progressActive ? "fill-[#8da2ff]/30 drop-shadow-[0_0_8px_rgba(141,162,255,0.8)]" : ""
              }`}
              strokeWidth={progressActive ? 2.5 : 2}
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* iOS home indicator giống ảnh mẫu */}
        <div className="mx-auto mt-2 h-1 w-32 rounded-full bg-white/90" aria-hidden="true" />
      </div>
    </nav>
  );
}

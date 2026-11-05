"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "pwa-dismissed-at";
const VISIT_KEY = "pwa-visit-count";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari cũ: navigator.standalone
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function shouldSuppressByDismiss(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function bumpVisitCount(): number {
  try {
    const next = Number(localStorage.getItem(VISIT_KEY) || "0") + 1;
    localStorage.setItem(VISIT_KEY, String(next));
    return next;
  } catch {
    return 2;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "other">("other");

  useEffect(() => {
    if (isStandalone() || shouldSuppressByDismiss()) return;

    const visits = bumpVisitCount();
    // Chỉ hiện từ lượt visit thứ 2 để tránh làm phiền lần đầu.
    if (visits < 2) return;

    // Chỉ hiện trên mobile viewport.
    if (window.innerWidth >= 768) return;

    setPlatform(isIos() ? "ios" : "android");

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    // iOS không có beforeinstallprompt: hiện hướng dẫn thủ công.
    if (isIos()) {
      setVisible(true);
    }

    const onAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Bỏ qua lỗi quota.
    }
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
        setDeferredPrompt(null);
      }
      return choice.outcome;
    }
    return "dismissed" as const;
  }, [deferredPrompt]);

  return { visible, platform, canPrompt: Boolean(deferredPrompt), install, dismiss };
}

"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "pwa-dismissed-at";
const VISIT_KEY = "pwa-visit-count";
const BUMP_SESSION_KEY = "pwa-visit-bumped-this-session";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MOBILE_MAX_WIDTH = 768;

// ---------------------------------------------------------------------------
// Cache module-level: Chrome chỉ bắn `beforeinstallprompt` 1 lần / page load.
// Nếu listener gắn muộn (sau khi event đã bắn) hoặc component remount
// (chuyển locale / client navigation) thì state trong hook sẽ mất prompt
// -> banner "lúc hiện lúc không". Cache ở module + listener toàn cục gắn
// ngay khi bundle client được load để không bao giờ miss event.
//
// Ngoài ra: script inline trong <head> của root layout capture event ngay từ
// đầu (trước khi React bundle eval) và lưu vào window.__fwBeforeInstallPrompt.
// Chrome thường fire event này rất sớm (ngay khi SW active) nên chỉ listen
// trong useEffect là không đủ tin cậy.
// ---------------------------------------------------------------------------
type PwaGlobal = Window & {
  __fwBeforeInstallPrompt?: BeforeInstallPromptEvent | null;
};

let cachedPrompt: BeforeInstallPromptEvent | null = null;
let globalListenerAttached = false;
const promptSubscribers = new Set<(p: BeforeInstallPromptEvent | null) => void>();

function notifyPromptSubscribers() {
  promptSubscribers.forEach((cb) => {
    try {
      cb(cachedPrompt);
    } catch {
      // Bỏ qua lỗi subscriber lẻ.
    }
  });
}

function readGlobalPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  const g = window as PwaGlobal;
  return g.__fwBeforeInstallPrompt ?? null;
}

function attachGlobalPromptListener() {
  if (globalListenerAttached || typeof window === "undefined") return;
  globalListenerAttached = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    cachedPrompt = e as BeforeInstallPromptEvent;
    notifyPromptSubscribers();
  });
  window.addEventListener("appinstalled", () => {
    cachedPrompt = null;
    notifyPromptSubscribers();
  });
  // Event bridge từ inline <head> script (capture sớm hơn React).
  window.addEventListener("fw:beforeinstallprompt", () => {
    cachedPrompt = readGlobalPrompt();
    notifyPromptSubscribers();
  });
  window.addEventListener("fw:appinstalled", () => {
    cachedPrompt = null;
    notifyPromptSubscribers();
  });
}

if (typeof window !== "undefined") {
  attachGlobalPromptListener();
  // Nếu script inline đã capture trước khi module này eval, lấy lại prompt.
  cachedPrompt = readGlobalPrompt();
}

/** Chỉ dùng cho test: xóa prompt đã cache giữa các test để không rò rỉ. */
export function __resetPWAInstallForTests() {
  cachedPrompt = null;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari cũ: navigator.standalone
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream) {
    return true;
  }
  // iPadOS 13+ giả lập desktop Safari: UA = "Macintosh", nhưng vẫn là iPad.
  // Dò bằng maxTouchPoints > 1 để không nhầm với Mac thật (touchPoints = 0).
  const nav = window.navigator as unknown as { maxTouchPoints?: number; platform?: string };
  return (
    /Macintosh/i.test(ua) &&
    typeof nav.maxTouchPoints === "number" &&
    nav.maxTouchPoints > 1
  );
}

/** iPadOS: Safari không có beforeinstallprompt, cũng không có Share menu iOS. */
function isIpad(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as unknown as { maxTouchPoints?: number };
  return (
    typeof nav.maxTouchPoints === "number" &&
    nav.maxTouchPoints > 1 &&
    !/iphone|ipad|ipod/i.test(window.navigator.userAgent)
  );
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

/**
 * Mỗi tab session chỉ bump 1 lần. Tránh 2 nguồn flaky:
 * - StrictMode double-effect ở dev làm visit +2 / load.
 * - Client navigation remount layout làm visit tăng dù không phải visit mới.
 */
function bumpVisitOncePerSession(): number {
  try {
    if (sessionStorage.getItem(BUMP_SESSION_KEY)) {
      return Number(localStorage.getItem(VISIT_KEY) || "0");
    }
    const next = Number(localStorage.getItem(VISIT_KEY) || "0") + 1;
    localStorage.setItem(VISIT_KEY, String(next));
    sessionStorage.setItem(BUMP_SESSION_KEY, "1");
    return next;
  } catch {
    return 2;
  }
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_MAX_WIDTH;
}

export function usePWAInstall() {
  // Khởi tạo từ cache để hứng event đã bắn trước khi mount.
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(() => cachedPrompt);
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "other">("other");

  const recompute = useCallback((p: BeforeInstallPromptEvent | null = cachedPrompt) => {
    if (isStandalone() || shouldSuppressByDismiss()) {
      setVisible(false);
      return;
    }
    // Chỉ hiện từ lượt visit thứ 2 để tránh làm phiền lần đầu.
    let visits = 2;
    try {
      visits = Number(localStorage.getItem(VISIT_KEY) || "0");
    } catch {
      // Không đọc được storage thì vẫn cho hiện để không kẹt ẩn vĩnh viễn.
    }
    if (visits < 2) {
      setVisible(false);
      return;
    }
    // Chỉ hiện trên mobile viewport (đồng bộ với class `md:hidden` của banner).
    if (!isMobileViewport()) {
      setVisible(false);
      return;
    }

    setPlatform(isIos() ? "ios" : "android");

    // iOS không có beforeinstallprompt: hiện hướng dẫn thủ công.
    // Android/Desktop Chromium: cần prompt đã cache mới hiện nút Install.
    setVisible(isIos() ? true : p !== null);
  }, []);

  useEffect(() => {
    bumpVisitOncePerSession();

    const onPrompt = (p: BeforeInstallPromptEvent | null) => {
      setPrompt(p);
      recompute(p);
    };
    promptSubscribers.add(onPrompt);

    // Viewport xoay / resize / kéo DevTools: tính lại thay vì kẹt trạng thái lúc mount.
    const onResize = () => recompute();
    window.addEventListener("resize", onResize);

    // Cài xong (display-mode đổi sang standalone) thì ẩn banner.
    const mq = window.matchMedia("(display-mode: standalone)");
    const onDisplayChange = () => recompute();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onDisplayChange);
    } else {
      mq.addListener(onDisplayChange);
    }

    // Dismiss ở tab khác cũng ẩn banner tab này.
    const onStorage = (e: StorageEvent) => {
      if (e.key === DISMISS_KEY) recompute();
    };
    window.addEventListener("storage", onStorage);

    setPrompt(cachedPrompt);
    recompute();

    return () => {
      promptSubscribers.delete(onPrompt);
      window.removeEventListener("resize", onResize);
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", onDisplayChange);
      } else {
        mq.removeListener(onDisplayChange);
      }
      window.removeEventListener("storage", onStorage);
    };
  }, [recompute]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Bỏ qua lỗi quota.
    }
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    const p = cachedPrompt ?? prompt;
    if (p) {
      await p.prompt();
      const choice = await p.userChoice;
      if (choice.outcome === "accepted") {
        cachedPrompt = null;
        setPrompt(null);
        setVisible(false);
      }
      return choice.outcome;
    }
    return "dismissed" as const;
  }, [prompt]);

  return { visible, platform, canPrompt: prompt !== null, install, dismiss };
}

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { InstallAppBanner } from "@/components/pwa/InstallAppBanner";
import { __resetPWAInstallForTests } from "@/components/pwa/usePWAInstall";

function setMobileViewport(width = 390) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
}

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: ua,
    configurable: true,
  });
}

function setStandalone(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("standalone") ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function fireBeforeInstallPrompt() {
  const e = new Event("beforeinstallprompt", { cancelable: true });
  // Chrome cho phép preventDefault để trì hoãn prompt
  const preventSpy = vi.spyOn(e, "preventDefault");
  (e as unknown as { prompt: () => Promise<void> }).prompt = vi.fn().mockResolvedValue(undefined);
  (e as unknown as { userChoice: Promise<unknown> }).userChoice = Promise.resolve({
    outcome: "accepted",
    platform: "android",
  });
  fireEvent(window, e);
  return { event: e, preventSpy };
}

describe("PWA Install — usePWAInstall + InstallAppBanner", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    __resetPWAInstallForTests();
    setMobileViewport(390);
    setUserAgent(ANDROID_UA);
    setStandalone(false);
    // Xóa flag standalone iOS nếu test trước để lại
    try {
      delete (window.navigator as unknown as { standalone?: boolean }).standalone;
    } catch {
      /* noop */
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ẩn banner ở lượt visit đầu tiên (chống làm phiền)", () => {
    render(<InstallAppBanner />);
    expect(screen.queryByTestId("pwa-install-banner")).not.toBeInTheDocument();
    expect(localStorage.getItem("pwa-visit-count")).toBe("1");
  });

  it("hiện banner Android sau visit thứ 2 + beforeinstallprompt, nút Install gọi prompt", async () => {
    localStorage.setItem("pwa-visit-count", "1");
    render(<InstallAppBanner />);
    expect(screen.queryByTestId("pwa-install-banner")).not.toBeInTheDocument();

    const { preventSpy } = fireBeforeInstallPrompt();

    expect(preventSpy).toHaveBeenCalled();
    const banner = await screen.findByTestId("pwa-install-banner");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute("role", "dialog");

    const installBtn = screen.getByTestId("pwa-install-button");
    expect(installBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(installBtn);
    });
    // accepted -> banner tự ẩn
    expect(screen.queryByTestId("pwa-install-banner")).not.toBeInTheDocument();
  });

  it("nút dismiss ghi pwa-dismissed-at và ẩn banner, 7 ngày không hiện lại", async () => {
    localStorage.setItem("pwa-visit-count", "1");
    const { unmount } = render(<InstallAppBanner />);
    fireBeforeInstallPrompt();
    await screen.findByTestId("pwa-install-banner");

    fireEvent.click(screen.getByTestId("pwa-install-dismiss"));
    expect(screen.queryByTestId("pwa-install-banner")).not.toBeInTheDocument();
    expect(localStorage.getItem("pwa-dismissed-at")).toBeTruthy();
    unmount();

    // Mount lại ngay -> bị suppress bởi TTL dismiss
    render(<InstallAppBanner />);
    fireBeforeInstallPrompt();
    // Cho effect chạy xong
    await act(async () => {});
    expect(screen.queryByTestId("pwa-install-banner")).not.toBeInTheDocument();
  });

  it("không hiện trên desktop viewport >= 768px", async () => {
    localStorage.setItem("pwa-visit-count", "5");
    setMobileViewport(1280);
    render(<InstallAppBanner />);
    fireBeforeInstallPrompt();
    await act(async () => {});
    expect(screen.queryByTestId("pwa-install-banner")).not.toBeInTheDocument();
  });

  it("không hiện khi đã ở display-mode standalone", async () => {
    localStorage.setItem("pwa-visit-count", "5");
    setStandalone(true);
    render(<InstallAppBanner />);
    fireBeforeInstallPrompt();
    await act(async () => {});
    expect(screen.queryByTestId("pwa-install-banner")).not.toBeInTheDocument();
  });

  it("iOS hiện hướng dẫn thủ công, không có nút Install", async () => {
    localStorage.setItem("pwa-visit-count", "5");
    setUserAgent(IOS_UA);
    render(<InstallAppBanner />);

    const banner = await screen.findByTestId("pwa-install-banner");
    expect(banner).toBeInTheDocument();
    // iOS branch render iosSteps, không render nút install
    expect(screen.queryByTestId("pwa-install-button")).not.toBeInTheDocument();
    expect(banner.textContent).toMatch(/Chia sẻ|Add to Home Screen|chia sẻ/i);
  });

  it("sự kiện appinstalled ẩn banner đang hiện", async () => {
    localStorage.setItem("pwa-visit-count", "1");
    render(<InstallAppBanner />);
    fireBeforeInstallPrompt();
    await screen.findByTestId("pwa-install-banner");

    fireEvent(window, new Event("appinstalled"));
    expect(screen.queryByTestId("pwa-install-banner")).not.toBeInTheDocument();
  });

  it("event bắn trước khi mount vẫn hiện banner (không miss prompt)", async () => {
    localStorage.setItem("pwa-visit-count", "5");
    // Event bắn trước khi component mount — logic cũ gắn listener trong
    // effect nên miss event này, banner không bao giờ hiện.
    fireBeforeInstallPrompt();

    render(<InstallAppBanner />);
    const banner = await screen.findByTestId("pwa-install-banner");
    expect(banner).toBeInTheDocument();
    expect(screen.getByTestId("pwa-install-button")).not.toBeDisabled();
  });

  it("remount trong cùng session không bump visit (không làm banner chập chờn)", async () => {
    localStorage.setItem("pwa-visit-count", "1");
    const { unmount } = render(<InstallAppBanner />);
    expect(localStorage.getItem("pwa-visit-count")).toBe("2");

    // Client navigation remount layout — visit không được tăng nữa.
    unmount();
    render(<InstallAppBanner />);
    expect(localStorage.getItem("pwa-visit-count")).toBe("2");

    // Prompt đến sau remount vẫn hiện banner ổn định.
    fireBeforeInstallPrompt();
    const banner = await screen.findByTestId("pwa-install-banner");
    expect(banner).toBeInTheDocument();
  });

  it("prompt capture bởi inline <head> script (window.__fwBeforeInstallPrompt) vẫn hiện banner", async () => {
    // Inline script trong <head> capture event TRƯỚC khi React bundle eval.
    // Hook phải đọc lại từ global để không miss prompt.
    localStorage.setItem("pwa-visit-count", "5");
    const fakePrompt = {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted", platform: "android" }),
    };
    (window as unknown as { __fwBeforeInstallPrompt?: unknown }).__fwBeforeInstallPrompt =
      fakePrompt;

    render(<InstallAppBanner />);
    const banner = await screen.findByTestId("pwa-install-banner");
    expect(banner).toBeInTheDocument();
    expect(screen.getByTestId("pwa-install-button")).not.toBeDisabled();

    delete (window as unknown as { __fwBeforeInstallPrompt?: unknown })
      .__fwBeforeInstallPrompt;
  });

  it("iPadOS (UA Macintosh + maxTouchPoints>1) hiện hướng dẫn iPad, không có nút Install", async () => {
    localStorage.setItem("pwa-visit-count", "5");
    setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    );
    Object.defineProperty(window.navigator, "maxTouchPoints", {
      value: 5,
      configurable: true,
    });

    render(<InstallAppBanner />);
    const banner = await screen.findByTestId("pwa-install-banner");
    expect(banner).toBeInTheDocument();
    // Không có beforeinstallprompt trên iPad → không render nút Install.
    expect(screen.queryByTestId("pwa-install-button")).not.toBeInTheDocument();
    // Hướng dẫn riêng cho iPad.
    expect(banner.textContent).toMatch(/iPad/i);

    delete (window.navigator as unknown as { maxTouchPoints?: number }).maxTouchPoints;
  });
});

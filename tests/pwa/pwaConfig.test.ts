import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

describe("PWA manifest + metadata", () => {
  it("manifest.webmanifest hợp lệ: name, display standalone, theme_color, icons any + maskable", () => {
    const path = resolve(ROOT, "public/manifest.webmanifest");
    expect(existsSync(path)).toBe(true);
    const manifest = JSON.parse(readFileSync(path, "utf-8"));

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toContain("utm_source=pwa");
    expect(manifest.theme_color).toBe("#4255ff");
    expect(Array.isArray(manifest.icons)).toBe(true);

    const purposes = manifest.icons.map((i: { purpose: string }) => i.purpose);
    expect(purposes).toContain("any");
    expect(purposes).toContain("maskable");

    for (const icon of manifest.icons) {
      expect(icon.src).toBeTruthy();
      expect(icon.sizes).toMatch(/^\d+x\d+$/);
      const abs = resolve(ROOT, "public", icon.src.replace(/^\//, ""));
      expect(existsSync(abs), `icon file missing: ${icon.src}`).toBe(true);
    }
  });

  it("root layout export manifest + appleWebApp + themeColor #4255ff", () => {
    // Không import trực tiếp layout.tsx vì next/font/google không chạy
    // được trong vitest — đọc source dạng text và assert.
    const layout = readFileSync(resolve(ROOT, "src/app/layout.tsx"), "utf-8");
    expect(layout).toMatch(/manifest:\s*["']\/manifest\.webmanifest["']/);
    expect(layout).toMatch(/appleWebApp:\s*\{[^}]*capable:\s*true/);
    expect(layout).toMatch(/themeColor:\s*["']#4255ff["']/);
  });

  it("service worker sw.ts dùng NetworkOnly cho /api/v1/* (không cache token)", () => {
    const sw = readFileSync(resolve(ROOT, "src/app/sw.ts"), "utf-8");
    expect(sw).toMatch(/NetworkOnly/);
    expect(sw).toMatch(/\/api\/v1\//);
    expect(sw).toMatch(/__SW_MANIFEST/);
  });

  it("manifest: icons khai đúng kích thước file thật, không có screenshots sai", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(ROOT, "public/manifest.webmanifest"), "utf-8"),
    );

    // `screenshots` cần ảnh chụp màn hình thật. Khai sai kích thước (ví dụ
    // logo ngang 384x141 khai là 384x384) làm Chrome cảnh báo manifest invalid.
    expect(manifest.screenshots ?? []).toEqual([]);

    for (const icon of manifest.icons) {
      const abs = resolve(ROOT, "public", icon.src.replace(/^\//, ""));
      expect(existsSync(abs), `icon file missing: ${icon.src}`).toBe(true);
      const declared = /^(\d+)x(\d+)$/.exec(icon.sizes);
      expect(declared, `icon sizes invalid: ${icon.sizes}`).toBeTruthy();
      const [, w, h] = declared!;
      // File thật phải khớp kích thước khai báo.
      const buf = readFileSync(abs);
      const pngW = buf.readUInt32BE(16);
      const pngH = buf.readUInt32BE(20);
      expect(`${pngW}x${pngH}`, `icon size mismatch: ${icon.src}`).toBe(
        `${w}x${h}`,
      );
    }
  });

  it("apple-touch-icon nền đục (iOS không tự bo nền cho icon trong suốt)", () => {
    const path = resolve(ROOT, "public/apple-touch-icon.png");
    expect(existsSync(path)).toBe(true);
    const buf = readFileSync(path);
    expect(buf.readUInt32BE(16)).toBe(180);
    expect(buf.readUInt32BE(20)).toBe(180);
  });

  it("root layout có viewport-fit=cover + mobile-web-app-capable cho iOS", () => {
    const layout = readFileSync(resolve(ROOT, "src/app/layout.tsx"), "utf-8");
    // viewport-fit=cover là điều kiện để env(safe-area-inset-*) có giá trị
    // trên iPhone có notch — thiếu nó thì header chồn lên Dynamic Island.
    expect(layout).toMatch(/viewportFit:\s*["']cover["']/);
    // iOS 16.4+ ưu tiên mobile-web-app-capable.
    expect(layout).toMatch(/mobile-web-app-capable/);
    // Capture beforeinstallprompt trong <head> để không miss event sớm.
    expect(layout).toMatch(/__fwBeforeInstallPrompt/);
  });
});

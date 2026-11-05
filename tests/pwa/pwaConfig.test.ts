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
});

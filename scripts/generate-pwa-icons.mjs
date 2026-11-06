/**
 * Sinh icon PWA 192/512 + maskable + apple-touch-icon từ logo nguồn.
 * Chạy: pnpm gen:pwa-icons
 */
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = path.join(root, "public/images/logos/logo-icon.png");
const outDir = path.join(root, "public/images/logos");

// Nền brand (đồng bộ theme_color #4255ff).
const BRAND = { r: 66, g: 85, b: 255, alpha: 1 };

async function ensureSource() {
  try {
    await fs.access(src);
  } catch {
    throw new Error(`Không tìm thấy logo nguồn: ${src}`);
  }
}

/** Icon nền đục (màu brand) + logo căn giữa. */
async function renderSolidIcon(size, dest) {
  const inner = Math.round(size * 0.8);
  const logo = await sharp(src)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(dest);

  console.log(`Đã sinh ${path.basename(dest)} (${size}x${size}, nền đục)`);
}

/** Icon trong suốt (giữ nguyên logo) — dùng cho `purpose: any`. */
async function renderTransparentIcon(size, dest) {
  await sharp(src)
    .resize(size, size, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(dest);
  console.log(`Đã sinh ${path.basename(dest)} (${size}x${size}, trong suốt)`);
}

await ensureSource();
await renderSolidIcon(192, path.join(outDir, "logo-icon-192.png"));
await renderSolidIcon(512, path.join(outDir, "logo-icon-512.png"));
await renderSolidIcon(512, path.join(outDir, "logo-maskable-512.png"));

// apple-touch-icon: iOS KHÔNG tự bo nền cho icon trong suốt — nó hiển thị
// nền đen. Bắt buộc icon phải nền đục. Kích thước chuẩn iOS = 180x180.
await renderSolidIcon(180, path.join(root, "public/apple-touch-icon.png"));

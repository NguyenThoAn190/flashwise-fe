/**
 * Sinh icon PWA 192/512 + maskable từ logo nguồn.
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

async function ensureSource() {
  try {
    await fs.access(src);
  } catch {
    throw new Error(`Không tìm thấy logo nguồn: ${src}`);
  }
}

async function renderIcon(size, destName, { maskable = false } = {}) {
  const dest = path.join(outDir, destName);
  // Maskable cần safe-zone: đặt logo 80% giữa nền trắng bo tròn.
  if (maskable) {
    const inner = Math.round(size * 0.8);
    const logo = await sharp(src)
      .resize(inner, inner, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 66, g: 85, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: logo, gravity: "center" }])
      .png()
      .toFile(dest);
  } else {
    await sharp(src)
      .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(dest);
  }
  console.log(`Đã sinh ${destName} (${size}x${size})`);
}

await ensureSource();
await renderIcon(192, "logo-icon-192.png");
await renderIcon(512, "logo-icon-512.png");
await renderIcon(512, "logo-maskable-512.png", { maskable: true });

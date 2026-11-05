"use client";

import Image from "next/image";

interface BrandLogoProps {
  /** lockup = icon ảnh + chữ Flashwise (dùng cho Header/Drawer); full = ảnh logo-full; icon = chỉ icon */
  variant?: "lockup" | "full" | "icon";
  /** Header là LCP nên bật priority để preload + fetchpriority=high */
  priority?: boolean;
  /** Chiều cao hiển thị (px) */
  height?: number;
  className?: string;
}

/**
 * Logo thương hiệu dùng chung toàn hệ thống.
 * - Dùng file đã resize sẵn (`logo-*-64/128`) thay vì PNG 500px gốc 44-61KB
 *   -> Header chỉ tải ~2.5KB PNG (Next tự convert WebP ~1.4KB).
 * - `next/image` tự `srcset` + lazy (trừ priority) + decode async.
 * - Luôn giữ chữ "Flashwise" trong DOM (visible hoặc sr-only) để test và a11y/SEO không vỡ.
 */
export function BrandLogo({
  variant = "lockup",
  priority = false,
  height = 32,
  className = "",
}: BrandLogoProps) {
  if (variant === "full") {
    // Ảnh đã autocrop padding (491x180, tỉ lệ 2.73:1) nên height hiển thị
    // = chiều cao chữ thật, không còn bị "nhỏ" do padding trong suốt.
    return (
      <span className={`inline-flex items-center ${className}`}>
        <Image
          src="/images/logos/logo-full-256.png"
          alt="Flashwise"
          width={256}
          height={94}
          style={{ height, width: "auto" }}
          sizes={`${Math.ceil(height * 2.73)}px`}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          decoding={priority ? "sync" : "async"}
        />
        <span className="sr-only">Flashwise</span>
      </span>
    );
  }

  if (variant === "icon") {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <Image
          src="/images/logos/logo-icon-64.png"
          alt="Flashwise"
          width={64}
          height={64}
          style={{ height, width: "auto" }}
          sizes={`${Math.ceil(height * 2)}px`}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          decoding={priority ? "sync" : "async"}
        />
        <span className="sr-only">Flashwise</span>
      </span>
    );
  }

  // lockup: icon ảnh + chữ Flashwise (mặc định cho Header/Drawer/AuthTopBar)
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/images/logos/logo-icon-64.png"
        alt=""
        aria-hidden="true"
        width={64}
        height={64}
        style={{ height, width: "auto" }}
        sizes={`${Math.ceil(height * 2)}px`}
        priority={priority}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
      />
      <span className="font-hurme font-bold text-2xl sm:text-3xl tracking-normal text-quizlet-indigo">
        Flashwise
      </span>
    </span>
  );
}

"use client";

import Image from "next/image";

interface BrandLogoProps {
  /** full = ảnh logo-full (dùng chung toàn hệ thống); icon = chỉ icon */
  variant?: "full" | "icon";
  /** Header là LCP nên bật priority để preload + fetchpriority=high */
  priority?: boolean;
  /** Chiều cao hiển thị (px) */
  height?: number;
  className?: string;
}

/**
 * Logo thương hiệu dùng chung toàn hệ thống — 100% logo ảnh.
 * - `full`: ảnh logo-full (icon + chữ Flashwise trong ảnh), dùng cho Header/Drawer/Auth.
 * - `icon`: chỉ icon.
 * - Luôn giữ chữ "Flashwise" sr-only trong DOM để test và a11y/SEO không vỡ.
 */
export function BrandLogo({
  variant = "full",
  priority = false,
  height = 38,
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

  // icon: chỉ icon ảnh
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

  // full (mặc định): ảnh logo-full — icon + chữ Flashwise đều nằm trong ảnh
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

"use client";

import React, { Suspense } from "react";
import { HomeSwitcher } from "@/components/home/HomeSwitcher";
import { DashboardSkeleton } from "@/components/home/DashboardSkeleton";

// Trang chủ theo locale tiền tố (/en, /vi, ...): giữ một URL duy nhất cho SEO.
// Hint cookie auth do `[locale]/layout.tsx` đọc ở Server và truyền qua
// `AuthProvider initialHasToken` -> context `hasTokenHint`, nên `HomeSwitcher`
// ở đây không cần prop mà vẫn render skeleton khớp SSR ngay lần đầu.
export default function SingleRouteHomePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <HomeSwitcher />
    </Suspense>
  );
}

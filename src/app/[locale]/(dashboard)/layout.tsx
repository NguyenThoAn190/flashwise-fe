"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-quizlet-canvas flex flex-col selection:bg-quizlet-indigo-light selection:text-quizlet-indigo">
      {/* Sticky Flashwise Navigation Header */}
      <Header />

      {/* Single-route main: landing renders full-width, dashboard pages own their containers */}
      {/* pb-20 trên mobile để không bị MobileBottomNav che CTA, desktop giữ nguyên */}
      <main className="flex-1 w-full pb-20 md:pb-0">{children}</main>

      {/* Bottom tab bar mobile kiểu app — chỉ hiện sau đăng nhập */}
      <MobileBottomNav />
    </div>
  );
}

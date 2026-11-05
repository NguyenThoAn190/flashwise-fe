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
      {/* pb-28 on mobile reserves space for the floating bottom nav */}
      <main className="flex-1 w-full pb-28 md:pb-0">{children}</main>

      {/* Floating mobile bottom nav — authenticated users only */}
      <MobileBottomNav />
    </div>
  );
}

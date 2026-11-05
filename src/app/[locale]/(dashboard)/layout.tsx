"use client";

import React from "react";
import { Header } from "@/components/layout/Header";

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
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}

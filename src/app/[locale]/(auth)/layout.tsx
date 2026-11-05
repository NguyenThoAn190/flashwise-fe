import React from "react";
import type { Metadata } from "next";
import { GuestGuard } from "@/components/auth/GuestGuard";
import { AuthTopBar } from "@/components/auth/AuthTopBar";

export const metadata: Metadata = {
  title: {
    template: "%s | Flashwise",
    default: "Authentication | Flashwise",
  },
  description: "Log in or sign up to study flashcards and learn anything with Flashwise.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <div className="min-h-screen bg-quizlet-canvas flex flex-col justify-between selection:bg-quizlet-indigo-light selection:text-quizlet-indigo">
        {/* Top Header with Flashwise Brand Logo */}
        <AuthTopBar />

        {/* Main Centered Authentication Card Container */}
        <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md bg-quizlet-surface rounded-quizlet-card border border-quizlet-border-light shadow-card p-6 sm:p-8 transition-shadow">
            {children}
          </div>
        </main>

        {/* Footer with Legal & Terms Links */}
        <footer className="w-full py-6 px-4 text-center text-xs text-quizlet-slate-muted">
          <div className="max-w-md mx-auto space-y-2">
            <p className="leading-relaxed">
              By continuing, you accept Flashwise&apos;s{" "}
              <a
                href="#"
                className="text-quizlet-slate font-medium underline hover:text-quizlet-indigo transition-colors"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-quizlet-slate font-medium underline hover:text-quizlet-indigo transition-colors"
              >
                Privacy Policy
              </a>
              .
            </p>
            <p className="text-[11px] text-quizlet-slate-muted/80">
              © {new Date().getFullYear()} Flashwise Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </GuestGuard>
  );
}

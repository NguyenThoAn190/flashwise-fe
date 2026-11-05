"use client";

import React from "react";

export function AuthLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Flashwise..."
      className="min-h-screen w-full flex flex-col items-center justify-center bg-quizlet-canvas text-quizlet-slate p-4"
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Hardware-accelerated dual ring spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-quizlet-border-light" />
          <div className="absolute inset-0 rounded-full border-4 border-quizlet-indigo border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-semibold text-quizlet-slate-secondary tracking-wide animate-pulse">
          Loading Flashwise...
        </p>
      </div>
    </div>
  );
}

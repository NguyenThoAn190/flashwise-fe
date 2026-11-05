"use client";

import React from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SettingsContent } from "@/components/settings/SettingsContent";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

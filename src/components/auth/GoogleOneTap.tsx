"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGoogleOneTapLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/lib/context/AuthContext";
import { isGoogleConfigured } from "./GoogleAuthProvider";
import { sanitizeRedirectUrl } from "@/lib/utils/authValidation";

export interface GoogleOneTapProps {
  redirectParam?: string | null;
  /**
   * Bật auto_select để giống Canva: user từng login Google rồi thì
   * One Tap tự chọn luôn không cần bấm. Mặc định true.
   */
  autoSelect?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Google One Tap kiểu Canva: popup nhỏ góc phải, bấm avatar là login luôn.
 * Dùng chung `loginGoogle(idToken)` với GoogleLoginButton nên backend
 * không cần sửa gì (vẫn POST /auth/social/google { provider, id_token }).
 *
 * Quy tắc mount (rất quan trọng để tránh bị Google rate-limit):
 * - Chỉ mount khi chưa login (`!isAuthenticated && !isLoading`) và đã có
 *   Client ID thật. Component tự return null sau khi login xong.
 * - Mỗi page chỉ mount 1 instance duy nhất.
 * - Lỗi One Tap luôn im lặng, giữ nút Google to làm fallback.
 */
export function GoogleOneTap({
  redirectParam,
  autoSelect = true,
  onSuccess,
  onError,
}: GoogleOneTapProps) {
  // Chưa cấu hình Client ID -> return null TRƯỚC khi gọi hook,
  // để LoginForm/SignupForm render được cả khi không có GoogleOAuthProvider
  // (test, SSR, preview env). Tách inner để giữ đúng rules-of-hooks.
  if (!isGoogleConfigured()) return null;
  return (
    <GoogleOneTapInner
      redirectParam={redirectParam}
      autoSelect={autoSelect}
      onSuccess={onSuccess}
      onError={onError}
    />
  );
}

function GoogleOneTapInner({
  redirectParam,
  autoSelect = true,
  onSuccess,
  onError,
}: GoogleOneTapProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, loginGoogle } = useAuth();

  const shouldPrompt = !isLoading && !isAuthenticated;

  useGoogleOneTapLogin({
    auto_select: autoSelect,
    cancel_on_tap_outside: true,
    disabled: !shouldPrompt,
    onSuccess: async (credentialResponse: CredentialResponse) => {
      const idToken = credentialResponse?.credential;
      if (!idToken) return;
      try {
        await loginGoogle(idToken);
        onSuccess?.();
        const destination = sanitizeRedirectUrl(redirectParam);
        router.push(destination);
      } catch (err: unknown) {
        // Im lặng như Canva: One Tap fail thì user vẫn còn nút Google to.
        const message =
          (err as { message?: string })?.message || "google_one_tap_failed";
        onError?.(message);
      }
    },
    onError: () => {
      // User bấm X / FedCM bị chặn / origins sai: không coi là lỗi UI.
      onError?.("google_one_tap_dismissed");
    },
  });

  // Không render DOM gì cả, popup do Google GIS tự vẽ.
  return null;
}

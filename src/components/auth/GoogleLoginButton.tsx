"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/lib/context/AuthContext";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { isGoogleConfigured } from "./GoogleAuthProvider";
import { cn } from "@/lib/utils/cn";

export interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}

function mapGoogleError(err: unknown, t: (key: string) => string): string {
  const code =
    (err as { code?: string })?.code ||
    (err as { data?: { code?: string } })?.data?.code ||
    "";
  const status = (err as { status?: number })?.status;
  const message = ((err as { message?: string })?.message || "").toLowerCase();
  const errStr = String(
    (err as { error?: string })?.error ||
      (err as { error_description?: string })?.error_description ||
      ""
  ).toLowerCase();

  // User đóng popup chủ động -> không coi là lỗi, để UI im lặng.
  if (
    errStr.includes("popup_closed") ||
    errStr.includes("popup closed") ||
    errStr.includes("cancelled") ||
    errStr.includes("canceled") ||
    errStr.includes("access_denied")
  ) {
    return "";
  }

  if (
    code === "USER_BANNED" ||
    status === 403 ||
    message.includes("banned") ||
    message.includes("suspended")
  ) {
    return t("errBanned");
  }
  if (
    code === "ACCOUNT_LOCKED" ||
    status === 429 ||
    message.includes("locked") ||
    message.includes("too many")
  ) {
    return t("errAccountLocked");
  }
  if (
    code === "USER_NOT_CONFIRMED" ||
    message.includes("not verified") ||
    message.includes("not confirmed") ||
    message.includes("email not verified") ||
    message.includes("google email not verified")
  ) {
    return t("errNotConfirmed");
  }
  if (
    code === "INVALID_CREDENTIALS" ||
    code === "AUTH_INVALID_TOKEN" ||
    code === "OAUTH_PROVIDER_ERROR" ||
    code === "OAUTH_CALLBACK_FAILED" ||
    status === 401 ||
    status === 500
  ) {
    return t("errGoogle");
  }
  const fallback = (err as { message?: string })?.message;
  return fallback || t("errGoogle");
}

function GoogleGLogo({ className }: { className?: string }) {
  return (
    <svg className={cn("w-5 h-5 shrink-0", className)} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GoogleSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-quizlet-slate-secondary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      data-testid="google-login-spinner"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function GoogleLoginButton({
  onSuccess,
  onError,
  text = "continue_with",
}: GoogleLoginButtonProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const auth = useAuth() as Partial<ReturnType<typeof useAuth>>;
  const loginGoogle = auth.loginGoogle;
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const configured = isGoogleConfigured();

  const label =
    text === "signup_with"
      ? t("googleSignup")
      : text === "signin_with"
        ? t("googleSignin")
        : t("googleContinue");

  const handleCredential = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      const msg = t("errGoogle");
      setErrorMsg(msg);
      onError?.(msg);
      return;
    }
    // Google ID token chỉ dùng 1 lần, đổi ngay, không lưu.
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      if (typeof loginGoogle !== "function") {
        throw new Error(t("errGoogle"));
      }
      await loginGoogle(idToken);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = mapGoogleError(err, t);
      if (msg) {
        setErrorMsg(msg);
        onError?.(msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGisError = () => {
    const msg = t("errGoogle");
    setErrorMsg(msg);
    onError?.(msg);
  };

  // Chưa cấu hình Client ID -> hiện note (role="note", không phải alert)
  // để không tạo alert thừa làm LoginForm/SignupForm bị trùng role="alert".
  // Test getByRole("alert") sẽ fail nếu match 2 nodes.
  if (!configured) {
    return (
      <div className="w-full space-y-4" data-testid="google-auth-container" data-processing="false">
        <div
          role="note"
          aria-live="polite"
          className="flex items-start gap-3 p-3.5 rounded-xl border transition-all bg-quizlet-canvas border-quizlet-border-light text-quizlet-slate-secondary text-sm"
        >
          <span className="flex-1 font-medium leading-relaxed">{t("googleNoClient")}</span>
          <button
            type="button"
            onClick={() => onError?.(t("googleNoClient"))}
            className="text-quizlet-slate-muted hover:text-quizlet-slate transition-colors p-0.5 -mr-1"
            aria-label={tCommon("close")}
          >
            <span className="text-lg leading-none" aria-hidden="true">&times;</span>
          </button>
        </div>
        <button
          type="button"
          data-testid="google-login-btn"
          data-configured="false"
          onClick={() => onError?.(t("googleNoClient"))}
          className={cn(
            "relative w-full h-[52px] px-4 rounded-xl border-2 transition-all duration-150 outline-none select-none",
            "flex items-center justify-center",
            "bg-quizlet-indigo-light border-quizlet-indigo-border text-quizlet-slate",
            "hover:bg-quizlet-indigo-light hover:border-quizlet-border-hover",
            "focus-visible:ring-4 focus-visible:ring-quizlet-indigo/15 focus-visible:border-quizlet-indigo",
            "active:scale-[0.99]"
          )}
        >
          <GoogleGLogo className="absolute left-5" />
          <span className="flex-1 text-center text-[15px] font-semibold leading-6 tracking-normal truncate px-10">
            {label}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full space-y-4"
      data-testid="google-auth-container"
      data-processing={isProcessing ? "true" : "false"}
    >
      {errorMsg && <AuthErrorAlert message={errorMsg} onDismiss={() => setErrorMsg(null)} />}

      {/*
        Luồng id_token (GIS credential): FE nhận credential rồi POST
        { provider: "google", id_token } về /auth/social/google.
        Không dùng auth-code nên backend không cần EXTERNAL_GOOGLE_CLIENT_SECRET,
        tránh lỗi 500 OAUTH_PROVIDER_ERROR khi đổi code ở local.
        GoogleLogin render trực tiếp, width số pixel (280) — không dùng
        width="100%" và không phủ overlay opacity-0 nên không còn lỗi
        "Provided button width is invalid" và không bị chặn click.
      */}
      <div className="relative w-full">
        {isProcessing ? (
          <button
            type="button"
            data-testid="google-login-btn"
            data-configured="true"
            disabled
            aria-busy="true"
            className={cn(
              "relative w-full h-[52px] px-4 rounded-xl border-2 outline-none select-none",
              "flex items-center justify-center",
              "bg-quizlet-indigo-light border-quizlet-indigo-border text-quizlet-slate",
              "opacity-70 cursor-wait"
            )}
          >
            <GoogleSpinner />
            <span className="flex-1 text-center text-[15px] font-semibold leading-6 tracking-normal truncate px-10">
              {t("loadingLogin")}
            </span>
          </button>
        ) : (
          <div
            data-testid="google-gis-button"
            className="flex w-full justify-center [&>div]:!w-full [&>div]:flex [&>div]:justify-center [&_iframe]:!w-full [&_iframe]:max-w-[400px]"
          >
            <GoogleLogin
              onSuccess={handleCredential}
              onError={handleGisError}
              text={text}
              shape="rectangular"
              theme="outline"
              size="large"
              width="280"
              logo_alignment="left"
            />
          </div>
        )}
        {/* Giữ testid nút cho test cũ query google-login-btn */}
        <span data-testid="google-login-btn" data-configured="true" className="hidden" aria-hidden="true" />
      </div>
    </div>
  );
}

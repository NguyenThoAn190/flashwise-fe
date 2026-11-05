"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/lib/context/AuthContext";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { isGoogleConfigured } from "./GoogleAuthProvider";
import { ApiError } from "@/types/api";

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
    status === 401
  ) {
    return t("errGoogle");
  }
  const fallback = (err as { message?: string })?.message;
  return fallback || t("errGoogle");
}

export function GoogleLoginButton({
  onSuccess,
  onError,
  text = "continue_with",
}: GoogleLoginButtonProps) {
  const t = useTranslations("auth");
  const { loginGoogle } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const configured = isGoogleConfigured();

  if (!configured) {
    const info = t("googleNoClient");
    return (
      <div className="w-full space-y-3" data-testid="google-auth-container">
        {errorMsg && (
          <AuthErrorAlert message={errorMsg} onDismiss={() => setErrorMsg(null)} />
        )}

        <button
          type="button"
          data-testid="google-login-btn"
          data-configured="false"
          onClick={() => {
            setErrorMsg(info);
            onError?.(info);
          }}
          className="w-full h-11 px-4 rounded-xl border border-quizlet-border bg-quizlet-surface hover:bg-quizlet-surface-hover hover:border-quizlet-slate-muted active:scale-[0.99] transition-all flex items-center justify-center gap-3 text-sm font-semibold text-quizlet-slate cursor-pointer shadow-xs"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
          <span>
            {text === "signup_with"
              ? t("googleSignup")
              : text === "signin_with"
                ? t("googleSignin")
                : t("googleContinue")}
          </span>
        </button>
      </div>
    );
  }

  const handleCredential = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      const msg = t("errGoogle");
      setErrorMsg(msg);
      onError?.(msg);
      return;
    }
    // Google ID tokens must be exchanged immediately; never persist them.
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await loginGoogle(idToken);
      onSuccess?.();
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? mapGoogleError(err, t)
          : mapGoogleError(err, t);
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGisError = () => {
    const msg = t("errGoogle");
    setErrorMsg(msg);
    onError?.(msg);
  };

  return (
    <div
      className="w-full space-y-3"
      data-testid="google-auth-container"
      data-processing={isProcessing ? "true" : "false"}
    >
      {errorMsg && (
        <AuthErrorAlert message={errorMsg} onDismiss={() => setErrorMsg(null)} />
      )}

      <div
        data-testid="google-login-btn"
        data-configured="true"
        aria-busy={isProcessing}
        className={isProcessing ? "pointer-events-none opacity-60" : undefined}
      >
        <GoogleLogin
          onSuccess={handleCredential}
          onError={handleGisError}
          text={text}
          shape="rectangular"
          theme="outline"
          size="large"
          width="100%"
          logo_alignment="left"
          containerProps={{ "data-testid": "google-gis-button" } as React.ComponentPropsWithoutRef<"div">}
        />
      </div>
    </div>
  );
}

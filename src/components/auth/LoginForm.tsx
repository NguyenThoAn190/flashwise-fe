"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { useAuth } from "@/lib/context/AuthContext";
import { AuthErrorAlert } from "./AuthErrorAlert";
import { GoogleLoginButton } from "./GoogleLoginButton";
import {
  validateLoginForm,
  LoginFormErrors,
  sanitizeRedirectUrl,
  getLocalePrefixFromPath,
} from "@/lib/utils/authValidation";

export interface LoginFormProps {
  redirectParam?: string | null;
}

export function LoginForm({ redirectParam }: LoginFormProps) {
  const t = useTranslations("auth");
  const tVal = useTranslations("validation");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect already authenticated users
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      const destination = sanitizeRedirectUrl(redirectParam);
      router.replace(destination);
    }
  }, [isAuthenticated, isAuthLoading, redirectParam, router]);

  const querySuffix = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
  const localePrefix = getLocalePrefixFromPath(pathname ?? `/${locale}`);
  const signupHref = `${localePrefix}/signup${querySuffix}`;
  const recoverHref = `${localePrefix}/recover`;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateLoginForm(
      { username, password },
      (key) => tVal(key)
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      await login({ username: username.trim(), password });
      const destination = sanitizeRedirectUrl(redirectParam);
      router.push(destination);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errorObj = err as { code?: string; message?: string; status?: number };
      const errorCode = errorObj?.code || "";
      const errorMsg = errorObj?.message || "";

      if (errorCode === "INVALID_CREDENTIALS" || errorMsg.includes("INVALID_CREDENTIALS") || errorMsg.toLowerCase().includes("invalid credentials")) {
        setServerError(t("errInvalidCredentials"));
      } else if (errorCode === "ACCOUNT_LOCKED" || errorObj?.status === 429) {
        setServerError(t("errAccountLocked"));
      } else if (errorCode === "USER_BANNED" || errorObj?.status === 403) {
        setServerError(t("errBanned"));
      } else if (errorCode === "USER_NOT_CONFIRMED") {
        setServerError(t("errNotConfirmed"));
      } else {
        setServerError(errorMsg || t("errLoginGeneric"));
      }
    }
  };

  return (
    <div id="auth-panel-login" role="tabpanel" aria-labelledby="auth-tab-login">
      <AuthErrorAlert
        message={serverError}
        onDismiss={() => setServerError(null)}
      />

      {/* Google Social Login */}
      <div className="space-y-4">
        <GoogleLoginButton
          text="continue_with"
          onSuccess={() => {
            const destination = sanitizeRedirectUrl(redirectParam);
            router.push(destination);
          }}
          onError={(err) => setServerError(err)}
        />

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-quizlet-border-light" />
          </div>
          <span className="relative bg-quizlet-surface px-3 text-xs font-bold uppercase text-quizlet-slate-muted">
            {t("orLoginWithEmail")}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
        {/* Email or Username Input */}
        <Input
          id="login-username"
          label={t("emailOrUsername")}
          name="username"
          type="text"
          autoComplete="username"
          placeholder={t("emailOrUsernamePlaceholder")}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
          }}
          error={errors.username}
          disabled={isSubmitting}
        />

        {/* Password Input with Visibility Toggle */}
        <div className="space-y-1">
          <Input
            id="login-password"
            label={t("password")}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            disabled={isSubmitting}
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-quizlet-slate-muted hover:text-quizlet-slate focus:outline-none focus:text-quizlet-indigo p-1 rounded transition-colors"
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Eye className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            }
          />
          <div className="flex justify-end pt-1">
            <Link
              href={recoverHref}
              className="text-xs font-semibold text-quizlet-slate-secondary hover:text-quizlet-indigo transition-colors"
            >
              {t("forgotPassword")}
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {t("loginSubmit")}
          </Button>
        </div>
      </form>

      {/* Switch to Signup Link */}
      <div className="mt-6 pt-5 border-t border-quizlet-border-light text-center">
        <p className="text-sm text-quizlet-slate-secondary">
          {t("newToApp")}{" "}
          <Link
            href={signupHref}
            className="font-bold text-quizlet-indigo hover:text-quizlet-indigo-hover underline-offset-2 hover:underline transition-all"
          >
            {t("createAccount")}
          </Link>
        </p>
      </div>
    </div>
  );
}

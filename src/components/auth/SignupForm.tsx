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
  validateSignupForm,
  SignupFormErrors,
  sanitizeRedirectUrl,
  getLocalePrefixFromPath,
} from "@/lib/utils/authValidation";

export interface SignupFormProps {
  redirectParam?: string | null;
}

export function SignupForm({ redirectParam }: SignupFormProps) {
  const t = useTranslations("auth");
  const tVal = useTranslations("validation");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { signup, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect already authenticated users
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      const destination = sanitizeRedirectUrl(redirectParam);
      router.replace(destination);
    }
  }, [isAuthenticated, isAuthLoading, redirectParam, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateSignupForm(
      {
        fullName,
        email,
        password,
        confirmPassword,
      },
      (key) => tVal(key)
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      await signup({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
      });
      const destination = sanitizeRedirectUrl(redirectParam);
      router.push(destination);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const errorObj = err as { code?: string; message?: string; status?: number };
      const errorCode = errorObj?.code || "";
      const errorMsg = errorObj?.message || "";

      if (
        errorCode === "USER_ALREADY_EXISTS" ||
        errorMsg.includes("USER_ALREADY_EXISTS") ||
        errorMsg.toLowerCase().includes("already registered") ||
        errorMsg.toLowerCase().includes("already exists") ||
        errorObj?.status === 422 ||
        errorObj?.status === 409
      ) {
        setServerError(t("errUserExists"));
      } else if (
        errorCode === "USER_WEAK_PASSWORD" ||
        errorMsg.includes("USER_WEAK_PASSWORD")
      ) {
        setServerError(t("errWeakPassword"));
      } else {
        setServerError(errorMsg || t("errSignupGeneric"));
      }
    }
  };

  const querySuffix = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
  const localePrefix = getLocalePrefixFromPath(pathname ?? `/${locale}`);
  const loginHref = `${localePrefix}/login${querySuffix}`;

  return (
    <div id="auth-panel-signup" role="tabpanel" aria-labelledby="auth-tab-signup" className="space-y-6">
      <AuthErrorAlert
        message={serverError}
        onDismiss={() => setServerError(null)}
      />

      {/* Google Social Signup */}
      <div className="space-y-5">
        <GoogleLoginButton
          text="signup_with"
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
          <span className="relative bg-quizlet-surface px-3 text-xs font-semibold normal-case tracking-normal text-quizlet-slate-muted">
            {t("orSignupWithEmail")}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Full Name Input */}
        <Input
          id="signup-fullname"
          label={t("fullName")}
          labelClassName="text-sm font-semibold normal-case tracking-normal"
          name="full_name"
          type="text"
          autoComplete="name"
          placeholder={t("fullNamePlaceholder")}
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
          }}
          error={errors.fullName}
          disabled={isSubmitting}
        />

        {/* Email Input */}
        <Input
          id="signup-email"
          label={t("email")}
          labelClassName="text-sm font-semibold normal-case tracking-normal"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email}
          disabled={isSubmitting}
        />

        {/* Password Input with Visibility Toggle */}
        <Input
          id="signup-password"
          label={t("password")}
          labelClassName="text-sm font-semibold normal-case tracking-normal"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder={t("createPasswordPlaceholder")}
          helperText={t("passwordHelper")}
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

        {/* Confirm Password Input with Visibility Toggle */}
        <Input
          id="signup-confirm-password"
          label={t("confirmPassword")}
          labelClassName="text-sm font-semibold normal-case tracking-normal"
          name="confirm_password"
          type={showConfirmPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder={t("confirmPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) {
              setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
          }}
          error={errors.confirmPassword}
          disabled={isSubmitting}
          endIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="text-quizlet-slate-muted hover:text-quizlet-slate focus:outline-none focus:text-quizlet-indigo p-1 rounded transition-colors"
              aria-label={showConfirmPassword ? t("hideConfirmPassword") : t("showConfirmPassword")}
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Eye className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          }
        />

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {t("signupSubmit")}
          </Button>
        </div>
      </form>

      {/* Switch to Login Link */}
      <div className="pt-6 border-t border-quizlet-border-light text-center">
        <p className="text-sm text-quizlet-slate-secondary">
          {t("haveAccount")}{" "}
          <Link
            href={loginHref}
            className="font-bold text-quizlet-indigo hover:text-quizlet-indigo-hover underline-offset-2 hover:underline transition-all"
          >
            {t("loginSubmit")}
          </Link>
        </p>
      </div>
    </div>
  );
}

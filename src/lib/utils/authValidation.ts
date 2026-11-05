/**
 * Authentication Form Validation Utilities
 *
 * Implements client-side validation rules matching Flashwise specifications
 * and PlayGrid API Gateway constraints.
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LoginFormValues {
  username: string;
  password: string;
}

export interface LoginFormErrors {
  username?: string;
  password?: string;
}

export interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface SignupFormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Validates login form inputs.
 * Pass `t` from `useTranslations("validation")` (or any `(key) => string`)
 * to get localized messages; defaults to English to stay backward compatible.
 */
export function validateLoginForm(
  values: LoginFormValues,
  t?: (key: string) => string
): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);

  if (!values.username || !values.username.trim()) {
    errors.username = msg("usernameRequired", "Email or username is required");
  }

  if (!values.password) {
    errors.password = msg("passwordRequired", "Password is required");
  }

  return errors;
}

/**
 * Validates signup form inputs (same optional-`t` pattern as login).
 */
export function validateSignupForm(
  values: SignupFormValues,
  t?: (key: string) => string
): SignupFormErrors {
  const errors: SignupFormErrors = {};
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);

  if (!values.fullName || !values.fullName.trim()) {
    errors.fullName = msg("fullNameRequired", "Full name is required");
  } else if (values.fullName.trim().length < 2) {
    errors.fullName = msg("fullNameMin", "Full name must be at least 2 characters");
  }

  if (!values.email || !values.email.trim()) {
    errors.email = msg("emailRequired", "Email is required");
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = msg("emailInvalid", "Please enter a valid email address");
  }

  if (!values.password) {
    errors.password = msg("passwordRequired", "Password is required");
  } else if (values.password.length < 8) {
    errors.password = msg("passwordMin", "Password must be at least 8 characters long");
  }

  if (values.confirmPassword !== undefined) {
    if (!values.confirmPassword) {
      errors.confirmPassword = msg("confirmRequired", "Confirm password is required");
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = msg("passwordMismatch", "Passwords do not match");
    }
  }

  return errors;
}

/**
 * Sanitizes redirect destination to prevent open-redirect attacks.
 * Allows only relative paths starting with a single '/' and rejects schemes, '//', and '/\'.
 */
export function sanitizeRedirectUrl(url: string | null | undefined, defaultUrl: string = "/"): string {
  if (!url) return defaultUrl;
  try {
    const decoded = decodeURIComponent(url).trim();
    if (
      decoded.startsWith("/") &&
      !decoded.startsWith("//") &&
      !decoded.startsWith("/\\") &&
      !decoded.includes(":")
    ) {
      return decoded;
    }
  } catch {
    // If malformed URI sequence, fall back to default
  }
  return defaultUrl;
}

/**
 * Locale-aware redirect helpers (next-intl `localePrefix: "as-needed"`,
 * `defaultLocale: "vi"` — vi has no prefix, others use `/{locale}`).
 * Keeps `/en/...` on EN pages instead of dropping back to VI `/login`.
 */
export const APP_LOCALES = ["en", "vi", "zh", "ja", "ko"] as const;
export type AppLocaleCode = (typeof APP_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocaleCode = "vi";

export function getLocalePrefixFromPath(pathname: string | null | undefined): string {
  if (!pathname) return "";
  const seg = pathname.split("/").filter(Boolean)[0];
  if (
    seg &&
    (APP_LOCALES as readonly string[]).includes(seg) &&
    seg !== DEFAULT_LOCALE
  ) {
    return `/${seg}`;
  }
  return "";
}

export function getLocaleFromPath(pathname: string | null | undefined): AppLocaleCode {
  if (!pathname) return DEFAULT_LOCALE;
  const seg = pathname.split("/").filter(Boolean)[0];
  if (seg && (APP_LOCALES as readonly string[]).includes(seg)) {
    return seg as AppLocaleCode;
  }
  return DEFAULT_LOCALE;
}

/** Prefixes a root-relative URL with the locale prefix when missing. */
export function localizeUrlForLocale(
  url: string,
  locale: string | null | undefined
): string {
  if (!url.startsWith("/")) return url;
  if (!locale || locale === DEFAULT_LOCALE) return url;
  const seg = url.split("/").filter(Boolean)[0];
  if (seg && (APP_LOCALES as readonly string[]).includes(seg)) return url;
  return `/${locale}${url}`;
}

/** Builds a locale-preserving `/login?redirect=...` URL. */
export function buildLoginUrl(
  currentPath: string,
  search?: string,
  pathnameForLocale?: string | null
): string {
  const prefix = getLocalePrefixFromPath(pathnameForLocale ?? currentPath);
  const full = search ? `${currentPath}?${search}` : currentPath;
  return `${prefix}/login?redirect=${encodeURIComponent(full)}`;
}

/** Locale-aware login/signup paths (used for logout, tabs, guards). */
export function getLoginPath(locale?: string | null): string {
  return localizeUrlForLocale("/login", locale);
}

export function getSignupPath(locale?: string | null): string {
  return localizeUrlForLocale("/signup", locale);
}

export function getDefaultHomeForLocale(locale?: string | null): string {
  return locale && locale !== DEFAULT_LOCALE ? `/${locale}` : "/";
}

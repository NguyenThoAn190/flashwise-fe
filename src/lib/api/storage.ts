/**
 * Client & SSR Safe Token Storage Utility
 * Synchronizes JWT access and refresh tokens between LocalStorage and Cookies.
 */

export const ACCESS_TOKEN_KEY = "quizlet_access_token";
export const REFRESH_TOKEN_KEY = "quizlet_refresh_token";
export const USER_CACHE_KEY = "quizlet_cached_user";

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

/**
 * Cookie Utilities
 */
export function setCookie(name: string, value: string, days = 7): void {
  if (!isBrowser) return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const isSecure = typeof window !== "undefined" && window.location?.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${secureFlag}`;
}

export function getCookie(name: string): string | null {
  if (!isBrowser) return null;
  const nameEQ = encodeURIComponent(name) + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length));
      } catch {
        return c.substring(nameEQ.length);
      }
    }
  }
  return null;
}

export function deleteCookie(name: string): void {
  if (!isBrowser) return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

/**
 * Token Accessors
 */
export function getAccessToken(): string | null {
  if (!isBrowser) return null;
  try {
    const local = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (local) return local;
    const cookie = getCookie(ACCESS_TOKEN_KEY);
    if (cookie) {
      try {
        localStorage.setItem(ACCESS_TOKEN_KEY, cookie);
      } catch {
        // LocalStorage quota or access denied fallback
      }
      return cookie;
    }
  } catch {
    return getCookie(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (!isBrowser) return null;
  try {
    const local = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (local) return local;
    const cookie = getCookie(REFRESH_TOKEN_KEY);
    if (cookie) {
      try {
        localStorage.setItem(REFRESH_TOKEN_KEY, cookie);
      } catch {
        // LocalStorage quota or access denied fallback
      }
      return cookie;
    }
  } catch {
    return getCookie(REFRESH_TOKEN_KEY);
  }
  return null;
}

export function setAccessToken(token: string): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // LocalStorage quota or access denied fallback
  }
  setCookie(ACCESS_TOKEN_KEY, token, 7);
}

export function setRefreshToken(token: string): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // LocalStorage quota or access denied fallback
  }
  setCookie(REFRESH_TOKEN_KEY, token, 30);
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  setAccessToken(accessToken);
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
}

export function clearTokens(): void {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // Ignore error
  }
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}

export function hasAccessToken(): boolean {
  return Boolean(getAccessToken());
}

/**
 * Cached User Accessors
 */
export function getCachedUser<T = unknown>(): T | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setCachedUser<T = unknown>(user: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Multi-tab Session Sync Listener
 */
export function onStorageAuthChange(callback: (token: string | null) => void): () => void {
  if (!isBrowser) return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key === ACCESS_TOKEN_KEY) {
      callback(event.newValue);
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  UserProfile,
  LoginCredentials,
  SignupData,
  AuthContextType,
} from "@/types/auth";
import {
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  loginWithGoogleCode as apiLoginWithGoogleCode,
  signup as apiSignup,
  signout as apiSignout,
  getProfile as apiGetProfile,
  refreshToken as apiRefreshToken,
} from "@/lib/api/auth";
import { getLocalePrefixFromPath } from "@/lib/utils/authValidation";
import {
  hasAccessToken,
  getRefreshToken,
  clearTokens,
  getCachedUser,
  setCachedUser,
  onStorageAuthChange,
} from "@/lib/api/storage";
import {
  prefetchDashboardData,
  clearDashboardPrefetch,
} from "@/lib/api/dashboardPrefetch";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
  /**
   * Server-side hint from `getServerAuthHint()` (cookie presence).
   * - false: no token cookie, skip the verify wait and render guest instantly.
   * - true/undefined: keep `isLoading=true` until `restoreSession` finishes.
   * Never trusted for auth decisions, only for first-paint branching.
   */
  initialHasToken?: boolean;
}

export function AuthProvider({ children, initialHasToken }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Luôn khởi tạo null để SSR và lần render đầu ở client giống nhau,
  // tránh hydration mismatch. Session sẽ được khôi phục trong useEffect.
  const [user, setUser] = useState<UserProfile | null>(null);

  // Loading state remains true until initial session restoration completes.
  // Guest (server says no token cookie) starts unblocked so `/` paints
  // landing immediately without one wasted loading tick.
  // `initialHasToken` is also exposed via context as `hasTokenHint` so
  // `HomeSwitcher`/Header can branch first-paint without hydration mismatch.
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    initialHasToken === false ? false : true
  );

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  /**
   * Session Restoration on Initial App Mount
   * NOTE: Khởi tạo user = null để SSR và lần render đầu ở client khớp nhau.
   * Cache chỉ được đọc trong useEffect (sau hydration) nên không gây mismatch.
   */
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      // Optimistic: đọc cache sau khi đã mount (không ảnh hưởng SSR/hydration)
      try {
        if (hasAccessToken()) {
          const cached = getCachedUser<UserProfile>();
          if (cached && isMounted) setUser(cached);
        }
      } catch {
        // Bỏ qua lỗi đọc cache
      }

      // 1. If no access token exists, mark loading false and clear user
      if (!hasAccessToken()) {
        clearDashboardPrefetch();
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // Song song hóa: study-sets + due-reviews bay ngay khi thấy token,
      // cùng lúc với apiGetProfile() verify bên dưới — DashboardHome sẽ
      // consume promise có sẵn thay vì chờ verify xong mới fetch (1 waterfall).
      prefetchDashboardData();

      // 2. Access token exists: verify and fetch fresh profile
      try {
        const profile = await apiGetProfile();
        if (isMounted) {
          setUser(profile);
          setCachedUser(profile);
        }
      } catch {
        // 3. If profile fetch fails, try renewing session with refresh token
        const currentRefreshToken = getRefreshToken();
        if (currentRefreshToken) {
          try {
            await apiRefreshToken();
            const refreshedProfile = await apiGetProfile();
            if (isMounted) {
              setUser(refreshedProfile);
              setCachedUser(refreshedProfile);
              return;
            }
          } catch {
            // Both access token and refresh token are invalid
            clearTokens();
            if (isMounted) setUser(null);
          }
        } else {
          clearTokens();
          if (isMounted) setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    // Multi-tab synchronization listener
    const unsubscribe = onStorageAuthChange(async (newToken) => {
      if (!newToken) {
        // Logged out in another browser tab
        setUser(null);
        setIsLoading(false);
      } else {
        // Logged in or token updated in another browser tab
        try {
          const profile = await apiGetProfile();
          if (isMounted) {
            setUser(profile);
            setCachedUser(profile);
          }
        } catch {
          // Ignore error on cross-tab sync
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  /**
   * Login Handler
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<UserProfile> => {
      setIsLoading(true);
      try {
        await apiLogin(credentials.username, credentials.password);
        const profile = await apiGetProfile();
        setUser(profile);
        setCachedUser(profile);
        return profile;
      } catch (error) {
        clearTokens();
        setUser(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Google Login Handler (GIS id_token)
   */
  const loginGoogle = useCallback(
    async (idToken: string): Promise<UserProfile> => {
      setIsLoading(true);
      try {
        await apiLoginWithGoogle(idToken);
        const profile = await apiGetProfile();
        setUser(profile);
        setCachedUser(profile);
        return profile;
      } catch (error) {
        clearTokens();
        setUser(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Google Login Handler (GIS popup auth-code).
   * FE-only: backend `/auth/social/google` already accepts `auth_code`.
   */
  const loginGoogleCode = useCallback(
    async (authCode: string): Promise<UserProfile> => {
      setIsLoading(true);
      try {
        await apiLoginWithGoogleCode(authCode);
        const profile = await apiGetProfile();
        setUser(profile);
        setCachedUser(profile);
        return profile;
      } catch (error) {
        clearTokens();
        setUser(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Signup Handler
   */
  const signup = useCallback(
    async (data: SignupData): Promise<UserProfile> => {
      setIsLoading(true);
      try {
        await apiSignup(data.email, data.password, data.full_name || "", data.username);
        // If tokens were not auto-attached, perform explicit login
        if (!hasAccessToken()) {
          await apiLogin(data.email, data.password);
        }
        const profile = await apiGetProfile();
        setUser(profile);
        setCachedUser(profile);
        return profile;
      } catch (error) {
        clearTokens();
        setUser(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Logout Handler
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiSignout();
    } catch (error) {
      console.warn("Signout API call failed; continuing with local cleanup:", error);
    } finally {
      clearTokens();
      setUser(null);
      setIsLoading(false);
      const prefix = getLocalePrefixFromPath(pathname);
      router.push(`${prefix}/login`);
    }
  }, [router, pathname]);

  /**
   * Refresh Profile Handler
   */
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const profile = await apiGetProfile();
      setUser(profile);
      setCachedUser(profile);
      return profile;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      loginGoogle,
      loginGoogleCode,
      signup,
      logout,
      refreshProfile,
      hasTokenHint: initialHasToken,
    }),
    [user, isAuthenticated, isLoading, login, loginGoogle, loginGoogleCode, signup, logout, refreshProfile, initialHasToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to consume the AuthContext
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

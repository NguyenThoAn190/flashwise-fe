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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Optimistically hydrate user from localStorage cache if token is present
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window === "undefined") return null;
    return hasAccessToken() ? getCachedUser<UserProfile>() : null;
  });

  // Loading state remains true until initial session restoration completes
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  /**
   * Session Restoration on Initial App Mount
   */
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      // 1. If no access token exists, mark loading false and clear user
      if (!hasAccessToken()) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

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
   * Google Login Handler
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
      signup,
      logout,
      refreshProfile,
    }),
    [user, isAuthenticated, isLoading, login, loginGoogle, signup, logout, refreshProfile]
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

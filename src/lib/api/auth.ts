/**
 * PlayGrid API Gateway Authentication Service
 * Implements login, signup, signout, getProfile, and refreshToken workflows.
 */

import { apiClient } from "./client";
import { API_ENDPOINTS } from "./config";
import {
  setTokens,
  clearTokens,
  getRefreshToken,
  setCachedUser,
  getCachedUser,
  hasAccessToken,
} from "./storage";
import {
  TokenResponse,
  UserProfile,
  SignupRequest,
  LoginRequest,
  SignoutRequest,
} from "@/types/auth";

export interface SignupResponse {
  user?: UserProfile;
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  [key: string]: unknown;
}

/**
 * Logs in a user via OAuth2 Password Grant or direct credentials.
 * Automatically updates stored access and refresh tokens.
 */
export async function login(username: string, password: string): Promise<TokenResponse> {
  const payload: LoginRequest = {
    grant_type: "password",
    username,
    password,
    email: username,
    aud: "authenticated",
  };

  const response = await apiClient.post<TokenResponse & { user?: UserProfile }>(
    API_ENDPOINTS.auth.token,
    payload,
    { skipAuth: true }
  );

  if (response.access_token) {
    setTokens(response.access_token, response.refresh_token);
  }

  if (response.user) {
    setCachedUser(response.user);
  }

  return response;
}

/**
 * Logs in or signs up a user using a verified Google OAuth ID Token.
 */
export async function loginWithGoogle(idToken: string): Promise<TokenResponse> {
  const payload = {
    provider: "google",
    id_token: idToken,
    channel: "web-app",
  };

  const response = await apiClient.post<TokenResponse & { user?: UserProfile }>(
    API_ENDPOINTS.auth.socialGoogle,
    payload,
    { skipAuth: true }
  );

  const resObj = response as TokenResponse & { user?: UserProfile };
  if (resObj?.access_token) {
    setTokens(resObj.access_token, resObj.refresh_token);
  }

  if (resObj?.user) {
    setCachedUser(resObj.user);
  }

  return response;
}

/**
 * Registers a new user account via email, password, and full name.
 * Automatically stores session tokens if returned by the Gateway.
 */
export async function signup(
  email: string,
  password: string,
  fullName: string,
  username?: string
): Promise<UserProfile> {
  const payload: SignupRequest = {
    email,
    password,
    full_name: fullName,
    username: username || email.split("@")[0],
    data: {
      full_name: fullName,
    },
    provider: "email",
    channel: "web-app",
  };

  const response = await apiClient.post<SignupResponse | UserProfile>(
    API_ENDPOINTS.auth.signup,
    payload,
    { skipAuth: true }
  );

  const resObj = response as SignupResponse;

  if (resObj.access_token) {
    setTokens(resObj.access_token, resObj.refresh_token);
  }

  const profile: UserProfile =
    resObj.user ||
    (resObj as unknown as UserProfile);

  if (profile && profile.email) {
    setCachedUser(profile);
    return profile;
  }

  return profile;
}

/**
 * Signs out the current user, invalidates tokens at the Gateway, and cleans local storage.
 */
export async function signout(): Promise<{ message: string; success?: boolean }> {
  const currentRefreshToken = getRefreshToken();
  const payload: SignoutRequest = {
    refresh_token: currentRefreshToken || undefined,
    all_devices: false,
  };

  try {
    const result = await apiClient.post<{ message: string; success?: boolean }>(
      API_ENDPOINTS.auth.signout,
      payload
    );
    return result;
  } finally {
    clearTokens();
  }
}

/**
 * Retrieves the current authenticated user's profile.
 * Automatically updates user cache in local storage.
 */
export async function getProfile(): Promise<UserProfile> {
  const profile = await apiClient.get<UserProfile>(API_ENDPOINTS.auth.profile);
  if (profile) {
    setCachedUser(profile);
  }
  return profile;
}

/**
 * Manually invokes token renewal using the stored refresh token.
 */
export async function refreshToken(): Promise<TokenResponse> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    throw new Error("No refresh token available");
  }

  const tokens = await apiClient.executeTokenRefresh(currentRefreshToken);
  setTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

/**
 * Checks whether an access token is stored.
 */
export function isAuthenticated(): boolean {
  return hasAccessToken();
}

/**
 * Returns cached user profile for instant optimistic rendering.
 */
export function getStoredProfile(): UserProfile | null {
  return getCachedUser<UserProfile>();
}

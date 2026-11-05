/**
 * Authentication and User Profile Types
 */

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  requires_2fa?: boolean;
  challenge_url?: string;
}

export interface UserMetadata {
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  [key: string]: unknown;
}

export interface AppMetadata {
  provider?: string;
  [key: string]: unknown;
}

export interface UserStats {
  total_study_sets?: number;
  cards_mastered?: number;
  current_streak?: number;
  [key: string]: unknown;
}

export interface UserProfile {
  id: string;
  public_id?: string;
  email: string;
  username?: string;
  full_name?: string;
  role?: string;
  avatar_url?: string;
  aud?: string;
  confirmed_at?: string | null;
  app_metadata?: AppMetadata;
  user_metadata?: UserMetadata;
  stats?: UserStats;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  grant_type: "password";
  username: string;
  password: string;
  email?: string;
  aud?: "authenticated" | "playgrid-api" | "playgrid-admin" | string;
  otp_code?: string;
}

export interface LoginCredentials {
  username: string; // Email or username
  password: string;
  aud?: "authenticated" | "playgrid-api" | "playgrid-admin" | string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
  data?: {
    full_name?: string;
    [key: string]: unknown;
  };
  provider?: string;
  channel?: string;
}

export interface SignupData {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
}

export interface RefreshTokenRequest {
  grant_type: "refresh_token";
  refresh_token: string;
}

export interface SignoutRequest {
  refresh_token?: string;
  all_devices?: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<UserProfile>;
  loginGoogle: (idToken: string) => Promise<UserProfile>;
  signup: (data: SignupData) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

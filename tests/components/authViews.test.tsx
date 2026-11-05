import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthLayout from "@/app/[locale]/(auth)/layout";
import LoginPage from "@/app/[locale]/(auth)/login/page";
import SignupPage from "@/app/[locale]/(auth)/signup/page";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import {
  validateLoginForm,
  validateSignupForm,
  sanitizeRedirectUrl,
} from "@/lib/utils/authValidation";

// 1. Mock Next.js Navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  // `next-intl/navigation` yêu cầu `redirect`/`permanentRedirect` từ module này
  // ngay lúc import, nên mock phải export đủ để không throw.
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/login",
}));

// 2. Mock AuthContext
const mockLogin = vi.fn();
const mockSignup = vi.fn();
let mockIsAuthenticated = false;
let mockIsAuthLoading = false;

vi.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockIsAuthenticated
      ? { id: "usr_mock_1", email: "test@flashwise.com", full_name: "Test User" }
      : null,
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsAuthLoading,
    login: mockLogin,
    signup: mockSignup,
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

describe("Milestone 2 - Authentication Views & Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    mockIsAuthLoading = false;
    mockSearchParams = new URLSearchParams();
  });

  /* ==========================================================================
     1. Unit Validation Tests
     ========================================================================== */
  describe("Auth Validation Utilities", () => {
    it("validates login form required fields", () => {
      const emptyErrors = validateLoginForm({ username: "", password: "" });
      expect(emptyErrors.username).toBe("Email or username is required");
      expect(emptyErrors.password).toBe("Password is required");

      const validErrors = validateLoginForm({ username: "user@test.com", password: "password123" });
      expect(Object.keys(validErrors)).toHaveLength(0);
    });

    it("validates signup form fields: email format, min length, and password match", () => {
      const errors = validateSignupForm({
        fullName: "A",
        email: "invalid-email",
        password: "short",
        confirmPassword: "mismatch",
      });

      expect(errors.fullName).toBe("Full name must be at least 2 characters");
      expect(errors.email).toBe("Please enter a valid email address");
      expect(errors.password).toBe("Password must be at least 8 characters long");
      expect(errors.confirmPassword).toBe("Passwords do not match");

      const validErrors = validateSignupForm({
        fullName: "John Doe",
        email: "john@example.com",
        password: "securePassword123",
        confirmPassword: "securePassword123",
      });
      expect(Object.keys(validErrors)).toHaveLength(0);
    });

    it("sanitizes redirect URLs safely against open redirects", () => {
      expect(sanitizeRedirectUrl("/set/create")).toBe("/set/create");
      expect(sanitizeRedirectUrl("/dashboard?tab=sets")).toBe("/dashboard?tab=sets");
      expect(sanitizeRedirectUrl("https://evil.com")).toBe("/");
      expect(sanitizeRedirectUrl("//evil.com")).toBe("/");
      expect(sanitizeRedirectUrl("/\\evil.com")).toBe("/");
      expect(sanitizeRedirectUrl("javascript:alert(1)")).toBe("/");
      expect(sanitizeRedirectUrl(null)).toBe("/");
      expect(sanitizeRedirectUrl(undefined, "/fallback")).toBe("/fallback");
    });
  });

  /* ==========================================================================
     2. AuthLayout Component
     ========================================================================== */
  describe("AuthLayout", () => {
    it("renders Flashwise brand logo and legal footer", () => {
      render(
        <AuthLayout>
          <div data-testid="auth-card-body">Auth Form Content</div>
        </AuthLayout>
      );

      // Verify brand link (brand đã đổi Flashwise)
      const logoLink = screen.getByLabelText("Flashwise Home");
      expect(logoLink).toBeDefined();
      expect(logoLink.getAttribute("href")).toBe("/");
      expect(logoLink.textContent).toContain("Flashwise");

      // Verify card content
      expect(screen.getByTestId("auth-card-body")).toBeDefined();

      // Verify footer disclaimer
      expect(screen.getByText(/Terms of Service/i)).toBeDefined();
      expect(screen.getByText(/Privacy Policy/i)).toBeDefined();
    });
  });

  /* ==========================================================================
     3. AuthTabs Component
     ========================================================================== */
  describe("AuthTabs", () => {
    it("renders login active tab with aria-selected true and preserved redirect", () => {
      render(<AuthTabs activeTab="login" redirectParam="/set/create" />);

      const loginTab = screen.getByRole("tab", { name: "Log in" });
      const signupTab = screen.getByRole("tab", { name: "Sign up" });

      expect(loginTab.getAttribute("aria-selected")).toBe("true");
      expect(signupTab.getAttribute("aria-selected")).toBe("false");

      expect(loginTab.getAttribute("href")).toBe("/login?redirect=%2Fset%2Fcreate");
      expect(signupTab.getAttribute("href")).toBe("/signup?redirect=%2Fset%2Fcreate");
    });

    it("renders signup active tab with aria-selected true", () => {
      render(<AuthTabs activeTab="signup" redirectParam={null} />);

      const loginTab = screen.getByRole("tab", { name: "Log in" });
      const signupTab = screen.getByRole("tab", { name: "Sign up" });

      expect(loginTab.getAttribute("aria-selected")).toBe("false");
      expect(signupTab.getAttribute("aria-selected")).toBe("true");

      expect(loginTab.getAttribute("href")).toBe("/login");
      expect(signupTab.getAttribute("href")).toBe("/signup");
    });
  });

  /* ==========================================================================
     4. AuthErrorAlert Component
     ========================================================================== */
  describe("AuthErrorAlert", () => {
    it("renders nothing when message is empty or null", () => {
      const { container } = render(<AuthErrorAlert message={null} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders alert role with error icon and text", () => {
      render(<AuthErrorAlert message="Invalid login credentials" />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeDefined();
      expect(alert.textContent).toContain("Invalid login credentials");
      expect(screen.getByTestId("auth-alert-icon")).toBeDefined();
    });

    it("triggers onDismiss when close button is clicked", () => {
      const dismissSpy = vi.fn();
      render(<AuthErrorAlert message="Dismissable error" onDismiss={dismissSpy} />);

      const dismissBtn = screen.getByLabelText("Dismiss alert");
      fireEvent.click(dismissBtn);

      expect(dismissSpy).toHaveBeenCalledTimes(1);
    });
  });

  /* ==========================================================================
     5. LoginForm Component
     ========================================================================== */
  describe("LoginForm", () => {
    it("renders inputs, forgot password link, and submits valid credentials", async () => {
      mockLogin.mockResolvedValueOnce({
        id: "usr_1",
        email: "demo@flashwise.local",
      });

      render(<LoginForm redirectParam="/dashboard" />);

      const usernameInput = screen.getByLabelText(/Email or username/i);
      const passwordInput = screen.getByLabelText(/^Password/i);
      const submitBtn = screen.getByRole("button", { name: "Log in" });

      // Password toggle button
      const toggleBtn = screen.getByLabelText("Show password");
      expect(passwordInput.getAttribute("type")).toBe("password");
      fireEvent.click(toggleBtn);
      expect(passwordInput.getAttribute("type")).toBe("text");
      fireEvent.click(screen.getByLabelText("Hide password"));
      expect(passwordInput.getAttribute("type")).toBe("password");

      // Fill in credentials
      fireEvent.change(usernameInput, { target: { value: "demo@flashwise.local" } });
      fireEvent.change(passwordInput, { target: { value: "SecretPass123!" } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: "demo@flashwise.local",
          password: "SecretPass123!",
        });
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("shows client-side validation errors when required fields are empty", async () => {
      render(<LoginForm />);

      const submitBtn = screen.getByRole("button", { name: "Log in" });
      fireEvent.click(submitBtn);

      expect(screen.getByText("Email or username is required")).toBeDefined();
      expect(screen.getByText("Password is required")).toBeDefined();
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("clears field error as the user types", async () => {
      render(<LoginForm />);

      const submitBtn = screen.getByRole("button", { name: "Log in" });
      fireEvent.click(submitBtn);

      const usernameInput = screen.getByLabelText(/Email or username/i);
      expect(screen.getByText("Email or username is required")).toBeDefined();

      fireEvent.change(usernameInput, { target: { value: "student@flashwise.com" } });
      expect(screen.queryByText("Email or username is required")).toBeNull();
    });

    it("displays mapped error banner when login API rejects", async () => {
      mockLogin.mockRejectedValueOnce({
        code: "INVALID_CREDENTIALS",
        message: "invalid credentials",
        status: 400,
      });

      render(<LoginForm />);

      const usernameInput = screen.getByLabelText(/Email or username/i);
      const passwordInput = screen.getByLabelText(/^Password/i);
      const submitBtn = screen.getByRole("button", { name: "Log in" });

      fireEvent.change(usernameInput, { target: { value: "wrong@flashwise.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrongPass" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText("The email, username, or password you entered is incorrect. Please try again.")
        ).toBeDefined();
      });
    });

    it("redirects already authenticated user away from login view", () => {
      mockIsAuthenticated = true;
      render(<LoginForm redirectParam="/set/create" />);

      expect(mockReplace).toHaveBeenCalledWith("/set/create");
    });
  });

  /* ==========================================================================
     6. SignupForm Component
     ========================================================================== */
  describe("SignupForm", () => {
    it("renders fields, validates password matching, and submits registration", async () => {
      mockSignup.mockResolvedValueOnce({
        id: "usr_new",
        email: "newstudent@flashwise.com",
      });

      render(<SignupForm redirectParam="/dashboard" />);

      const nameInput = screen.getByLabelText(/Full name/i);
      const emailInput = screen.getByLabelText(/Email address/i);
      const passwordInput = screen.getByLabelText(/^Password/i);
      const confirmInput = screen.getByLabelText(/^Confirm password$/i);
      const submitBtn = screen.getByRole("button", { name: "Create account" });

      // Test validation errors
      fireEvent.click(submitBtn);
      expect(screen.getByText("Full name is required")).toBeDefined();
      expect(screen.getByText("Email is required")).toBeDefined();
      expect(screen.getByText("Password is required")).toBeDefined();

      // Test invalid email and mismatched password
      fireEvent.change(nameInput, { target: { value: "Sam Student" } });
      fireEvent.change(emailInput, { target: { value: "bademail" } });
      fireEvent.change(passwordInput, { target: { value: "Password123!" } });
      fireEvent.change(confirmInput, { target: { value: "MismatchPass!" } });
      fireEvent.click(submitBtn);

      expect(screen.getByText("Please enter a valid email address")).toBeDefined();
      expect(screen.getByText("Passwords do not match")).toBeDefined();

      // Enter matching valid details
      fireEvent.change(emailInput, { target: { value: "sam@flashwise.com" } });
      fireEvent.change(confirmInput, { target: { value: "Password123!" } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith({
          email: "sam@flashwise.com",
          password: "Password123!",
          full_name: "Sam Student",
        });
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("displays error banner when signup API indicates user already exists", async () => {
      mockSignup.mockRejectedValueOnce({
        code: "USER_ALREADY_EXISTS",
        message: "user already exists",
        status: 422,
      });

      render(<SignupForm />);

      fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Existing User" } });
      fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: "exists@flashwise.com" } });
      fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: "Password123!" } });
      fireEvent.change(screen.getByLabelText(/^Confirm password$/i), { target: { value: "Password123!" } });

      fireEvent.click(screen.getByRole("button", { name: "Create account" }));

      await waitFor(() => {
        expect(
          screen.getByText("An account with this email already exists. Please log in instead.")
        ).toBeDefined();
      });
    });
  });

  /* ==========================================================================
     7. LoginPage & SignupPage Suspense Wrappers
     ========================================================================== */
  describe("LoginPage & SignupPage Component Wrappers", () => {
    it("renders LoginPage within Suspense boundary without throwing", () => {
      render(<LoginPage />);
      expect(screen.getByRole("tab", { name: "Log in" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Log in" })).toBeDefined();
    });

    it("renders SignupPage within Suspense boundary without throwing", () => {
      render(<SignupPage />);
      expect(screen.getByRole("tab", { name: "Sign up" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Create account" })).toBeDefined();
    });
  });
});

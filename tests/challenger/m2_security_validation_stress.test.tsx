import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  sanitizeRedirectUrl,
  validateLoginForm,
  validateSignupForm,
  EMAIL_REGEX,
} from "@/lib/utils/authValidation";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { GuestGuard } from "@/components/auth/GuestGuard";

// 1. Mock Next.js Navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockPathname = "/login";

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
  usePathname: () => mockPathname,
}));

// 2. Mock AuthContext
const mockLogin = vi.fn();
const mockSignup = vi.fn();
let mockIsAuthenticated = false;
let mockIsAuthLoading = false;

vi.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockIsAuthenticated
      ? { id: "usr_challenger_stress", email: "challenger@quizlet.com", full_name: "Challenger" }
      : null,
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsAuthLoading,
    login: mockLogin,
    signup: mockSignup,
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

describe("Milestone 2 Challenger: Security, Open-Redirect & Validation Stress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = false;
    mockIsAuthLoading = false;
    mockSearchParams = new URLSearchParams();
    mockPathname = "/login";
  });

  /* ==========================================================================
     1. Security Stress: Malicious Open-Redirect Payloads & Bypass Vectors
     ========================================================================== */
  describe("Open-Redirect Sanitization Stress (sanitizeRedirectUrl)", () => {
    describe("Protocol-relative URL bypass attempts", () => {
      it("neutralizes standard double-slash protocol-relative URLs", () => {
        expect(sanitizeRedirectUrl("//evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("//evil.com/phishing")).toBe("/");
        expect(sanitizeRedirectUrl("//evil.com:8080/path")).toBe("/");
        expect(sanitizeRedirectUrl("//attacker.org?token=steal")).toBe("/");
      });

      it("neutralizes multi-slash prefixes (///, ////, /////)", () => {
        expect(sanitizeRedirectUrl("///evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("////evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("/////evil.com/payload")).toBe("/");
        expect(sanitizeRedirectUrl("//////target.com")).toBe("/");
      });

      it("neutralizes user-info protocol-relative URLs (//user@evil.com)", () => {
        expect(sanitizeRedirectUrl("//victim.com@evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("//localhost:8080@attacker.com")).toBe("/");
      });
    });

    describe("Backslash and mixed-slash bypass vectors", () => {
      it("neutralizes slash-backslash combinations (/\evil.com, /\\evil.com)", () => {
        expect(sanitizeRedirectUrl("/\\evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("/\\/evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("/\\\\evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("/\\/\\evil.com")).toBe("/");
      });

      it("neutralizes reverse-slash and backslash-only starts (\\evil.com, \\/evil.com)", () => {
        expect(sanitizeRedirectUrl("\\evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("\\/evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("\\\\evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("\\\\evil.com\\payload")).toBe("/");
      });
    });

    describe("Absolute URLs with standard and exotic schemes", () => {
      it("neutralizes http and https absolute URLs", () => {
        expect(sanitizeRedirectUrl("https://evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("http://evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("https://evil.com/login")).toBe("/");
        expect(sanitizeRedirectUrl("http:evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("https:evil.com")).toBe("/");
      });

      it("neutralizes file, ftp, and other network schemes", () => {
        expect(sanitizeRedirectUrl("file:///etc/passwd")).toBe("/");
        expect(sanitizeRedirectUrl("ftp://ftp.evil.com/malware")).toBe("/");
        expect(sanitizeRedirectUrl("sftp://storage.evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("ws://socket.evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("wss://securesocket.evil.com")).toBe("/");
      });

      it("neutralizes pseudo-protocols and script execution schemes", () => {
        expect(sanitizeRedirectUrl("javascript:alert(1)")).toBe("/");
        expect(sanitizeRedirectUrl("javascript:void(0)")).toBe("/");
        expect(sanitizeRedirectUrl("JAVASCRIPT:alert(document.cookie)")).toBe("/");
        expect(sanitizeRedirectUrl("data:text/html,<script>alert(1)</script>")).toBe("/");
        expect(sanitizeRedirectUrl("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe("/");
        expect(sanitizeRedirectUrl("vbscript:msgbox(1)")).toBe("/");
        expect(sanitizeRedirectUrl("blob:https://evil.com/d94a973c-7476-4d1e-bfd1-447a16e78921")).toBe("/");
        expect(sanitizeRedirectUrl("about:blank")).toBe("/");
      });
    });

    describe("Encoded and obfuscated bypass attempts", () => {
      it("neutralizes URL-encoded forward slashes (%2F%2Fevil.com)", () => {
        expect(sanitizeRedirectUrl("%2F%2Fevil.com")).toBe("/");
        expect(sanitizeRedirectUrl("%2f%2fevil.com")).toBe("/");
        expect(sanitizeRedirectUrl("/%2fevil.com")).toBe("/");
      });

      it("neutralizes URL-encoded backslashes (/%5cevil.com)", () => {
        expect(sanitizeRedirectUrl("/%5cevil.com")).toBe("/");
        expect(sanitizeRedirectUrl("/%5Cevil.com")).toBe("/");
        expect(sanitizeRedirectUrl("/%5C%5Cevil.com")).toBe("/");
      });

      it("neutralizes double URL encoded vectors (%252f%252fevil.com)", () => {
        expect(sanitizeRedirectUrl("%252f%252fevil.com")).toBe("/");
        expect(sanitizeRedirectUrl("%252F%252Fevil.com")).toBe("/");
      });

      it("neutralizes URL-encoded schemes (https%3A%2F%2Fevil.com)", () => {
        expect(sanitizeRedirectUrl("https%3A%2F%2Fevil.com")).toBe("/");
        expect(sanitizeRedirectUrl("javascript%3Aalert(1)")).toBe("/");
      });

      it("neutralizes path-traversal strings and external host combinations", () => {
        // Path traversal with colon or scheme
        expect(sanitizeRedirectUrl("/../https://evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("/%2e%2e/https://evil.com")).toBe("/");
        // Relative path traversal staying internal
        const traversed = sanitizeRedirectUrl("/%2e%2e/evil.com");
        expect(traversed.startsWith("/")).toBe(true);
        expect(traversed.startsWith("//")).toBe(false);
      });

      it("neutralizes whitespace and control character padding around bypasses", () => {
        expect(sanitizeRedirectUrl("   //evil.com   ")).toBe("/");
        expect(sanitizeRedirectUrl("\t\t//evil.com\n")).toBe("/");
        expect(sanitizeRedirectUrl("\r\n//evil.com")).toBe("/");
      });

      it("safely handles malformed URI percent-encoding without throwing", () => {
        expect(sanitizeRedirectUrl("/%E0%A4%A")).toBe("/");
        expect(sanitizeRedirectUrl("/%A0%99%")).toBe("/");
        expect(sanitizeRedirectUrl("/%")).toBe("/");
        expect(sanitizeRedirectUrl("/%%20")).toBe("/");
      });
    });

    describe("Scheme in path query parameters and colons", () => {
      it("rejects URLs containing embedded colons to prevent scheme injection", () => {
        expect(sanitizeRedirectUrl("/login?next=https://evil.com")).toBe("/");
        expect(sanitizeRedirectUrl("/test:8080")).toBe("/");
        expect(sanitizeRedirectUrl("/javascript:foo")).toBe("/");
      });
    });

    describe("Legitimate internal navigation paths", () => {
      it("preserves legitimate root and clean relative paths", () => {
        expect(sanitizeRedirectUrl("/")).toBe("/");
        expect(sanitizeRedirectUrl("/dashboard")).toBe("/dashboard");
        expect(sanitizeRedirectUrl("/set/create")).toBe("/set/create");
        expect(sanitizeRedirectUrl("/set/set_12345/learn")).toBe("/set/set_12345/learn");
        expect(sanitizeRedirectUrl("/set/edit/55")).toBe("/set/edit/55");
      });

      it("preserves legitimate query strings and hashes without schemes", () => {
        expect(sanitizeRedirectUrl("/dashboard?tab=sets&page=2")).toBe("/dashboard?tab=sets&page=2");
        expect(sanitizeRedirectUrl("/set/view#card-4")).toBe("/set/view#card-4");
        expect(sanitizeRedirectUrl("/search?q=biology+quiz")).toBe("/search?q=biology+quiz");
      });
    });

    describe("Boundary, nullish, and custom fallback behavior", () => {
      it("handles null, undefined, empty, and whitespace strings", () => {
        expect(sanitizeRedirectUrl(null)).toBe("/");
        expect(sanitizeRedirectUrl(undefined)).toBe("/");
        expect(sanitizeRedirectUrl("")).toBe("/");
        expect(sanitizeRedirectUrl("   ")).toBe("/");
        expect(sanitizeRedirectUrl("\n\t")).toBe("/");
      });

      it("respects custom defaultUrl parameter when input is invalid or malicious", () => {
        expect(sanitizeRedirectUrl(null, "/custom-home")).toBe("/custom-home");
        expect(sanitizeRedirectUrl(undefined, "/dashboard")).toBe("/dashboard");
        expect(sanitizeRedirectUrl("//evil.com", "/safe-fallback")).toBe("/safe-fallback");
        expect(sanitizeRedirectUrl("https://evil.com", "/sets")).toBe("/sets");
        expect(sanitizeRedirectUrl("javascript:alert(1)", "/error")).toBe("/error");
      });
    });

    describe("Integration with Route Guards and Form Navigation", () => {
      it("GuestGuard redirects authenticated users safely to default when redirect param is malicious", async () => {
        mockIsAuthenticated = true;
        mockSearchParams = new URLSearchParams("redirect=//attacker.com/steal");

        render(
          <GuestGuard>
            <div>Protected Guest Content</div>
          </GuestGuard>
        );

        await waitFor(() => {
          expect(mockReplace).toHaveBeenCalledWith("/");
          expect(mockReplace).not.toHaveBeenCalledWith(expect.stringContaining("attacker.com"));
        });
      });

      it("GuestGuard redirects authenticated users to legitimate internal path", async () => {
        mockIsAuthenticated = true;
        mockSearchParams = new URLSearchParams("redirect=/set/create");

        render(
          <GuestGuard>
            <div>Protected Guest Content</div>
          </GuestGuard>
        );

        await waitFor(() => {
          expect(mockReplace).toHaveBeenCalledWith("/set/create");
        });
      });

      it("LoginForm pushes to safe default '/' when redirectParam is malicious", async () => {
        mockLogin.mockResolvedValueOnce({ id: "usr_1" });
        render(<LoginForm redirectParam="//evil.com/exploit" />);

        fireEvent.change(screen.getByLabelText(/Email or username/i), {
          target: { value: "student@quizlet.com" },
        });
        fireEvent.change(screen.getByLabelText(/^Password/i), {
          target: { value: "Secret123!" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Log in" }));

        await waitFor(() => {
          expect(mockLogin).toHaveBeenCalled();
          expect(mockPush).toHaveBeenCalledWith("/");
          expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining("evil.com"));
        });
      });

      it("SignupForm pushes to safe default '/' when redirectParam is an absolute URL", async () => {
        mockSignup.mockResolvedValueOnce({ id: "usr_2" });
        render(<SignupForm redirectParam="https://phishing.site/steal" />);

        fireEvent.change(screen.getByLabelText(/Full name/i), {
          target: { value: "New Student" },
        });
        fireEvent.change(screen.getByLabelText(/Email address/i), {
          target: { value: "new@quizlet.com" },
        });
        fireEvent.change(screen.getByLabelText(/^Password/i), {
          target: { value: "Password123!" },
        });
        fireEvent.change(screen.getByLabelText(/^Confirm password$/i), {
          target: { value: "Password123!" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));

        await waitFor(() => {
          expect(mockSignup).toHaveBeenCalled();
          expect(mockPush).toHaveBeenCalledWith("/");
          expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining("phishing.site"));
        });
      });
    });
  });

  /* ==========================================================================
     2. Validation Stress: Extreme Inputs, Unicode, Emojis, and ReDoS
     ========================================================================== */
  describe("Extreme Input Validation & ReDoS Stress", () => {
    describe("Input Length Stress (10,000+ characters)", () => {
      it("validates 10,000-character inputs without hanging or crashing", () => {
        const largeString = "A".repeat(10000);
        const loginErrors = validateLoginForm({
          username: largeString,
          password: largeString,
        });
        expect(loginErrors.username).toBeUndefined();
        expect(loginErrors.password).toBeUndefined();

        const signupErrors = validateSignupForm({
          fullName: "Student " + "X".repeat(9990),
          email: "large_user_" + "a".repeat(100) + "@example.com",
          password: largeString,
          confirmPassword: largeString,
        });
        expect(signupErrors.fullName).toBeUndefined();
        expect(signupErrors.email).toBeUndefined();
        expect(signupErrors.password).toBeUndefined();
        expect(signupErrors.confirmPassword).toBeUndefined();
      });

      it("empirically verifies EMAIL_REGEX has NO catastrophic backtracking (ReDoS defense)", () => {
        // Construct worst-case patterns: long repetitive sequences without matching '@' or '.'
        const prefix = "a".repeat(25000);
        const attackPayload1 = prefix + "!@#" + prefix;
        const attackPayload2 = "a".repeat(50000);
        const attackPayload3 = "user@" + "domain".repeat(5000); // Massive domain with no dot

        const startTime = performance.now();
        expect(EMAIL_REGEX.test(attackPayload1)).toBe(false);
        expect(EMAIL_REGEX.test(attackPayload2)).toBe(false);
        expect(EMAIL_REGEX.test(attackPayload3)).toBe(false);
        const elapsed = performance.now() - startTime;

        // Must complete all 3 massive evaluations well under 50 milliseconds
        expect(elapsed).toBeLessThan(50);
      });

      it("probes EMAIL_REGEX permissiveness on trailing dots and domain formats", () => {
        // Single dot at end is rejected because nothing follows the dot
        expect(EMAIL_REGEX.test("user@domain.")).toBe(false);
        // Missing username
        expect(EMAIL_REGEX.test("@domain.com")).toBe(false);
        // Missing @
        expect(EMAIL_REGEX.test("userdomain.com")).toBe(false);
        // Note: Simple regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ allows trailing dot if preceded by another dot:
        // 'user@example.com.' -> '[^\\s@]+' matches 'example', '.' matches '.', '[^\\s@]+' matches 'com.'
        expect(EMAIL_REGEX.test("user@example.com.")).toBe(true);
      });
    });

    describe("International Unicode & Multi-lingual Scripts", () => {
      it("accepts full names with complex diacritics and scripts", () => {
        // Vietnamese with compound tone marks
        const vnErrors = validateSignupForm({
          fullName: "Nguyễn Thị Ánh Tuyết",
          email: "tuyet.nguyen@example.com",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(vnErrors.fullName).toBeUndefined();

        // Cyrillic
        const ruErrors = validateSignupForm({
          fullName: "Владимир Владимирович",
          email: "vladimir@example.com",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(ruErrors.fullName).toBeUndefined();

        // CJK (Chinese, Japanese, Korean)
        const cjkErrors = validateSignupForm({
          fullName: "山田 太郎 / 李小龙 / 김철수",
          email: "cjk@example.com",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(cjkErrors.fullName).toBeUndefined();

        // Arabic
        const arErrors = validateSignupForm({
          fullName: "محمد عبد الله",
          email: "mohammed@example.com",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(arErrors.fullName).toBeUndefined();

        // French & German
        const deErrors = validateSignupForm({
          fullName: "Éléonore Müller-François",
          email: "muller@example.com",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(deErrors.fullName).toBeUndefined();
      });

      it("accepts Unicode usernames in login form", () => {
        const errors = validateLoginForm({
          username: "ユーザー名_42",
          password: "securePassword123",
        });
        expect(errors.username).toBeUndefined();
        expect(errors.password).toBeUndefined();
      });
    });

    describe("Emoji Passwords and Inputs", () => {
      it("accepts passwords containing multi-byte UTF-16 surrogate pair emojis", () => {
        // 8 emoji sequence
        const emojiPassword = "🔐🔑🛡️🔒💎✨🚀🌟";
        const errors = validateSignupForm({
          fullName: "Emoji User",
          email: "emoji@example.com",
          password: emojiPassword,
          confirmPassword: emojiPassword,
        });
        expect(errors.password).toBeUndefined();
        expect(errors.confirmPassword).toBeUndefined();
      });

      it("accepts full names containing emojis if length requirement is met", () => {
        const errors = validateSignupForm({
          fullName: "👩‍🚀 Astronaut",
          email: "astronaut@space.org",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(errors.fullName).toBeUndefined();
      });

      it("enforces minimum 8-character password length strictly", () => {
        // 7 characters (one below minimum)
        const shortErrors = validateSignupForm({
          fullName: "Valid Name",
          email: "test@example.com",
          password: "1234567",
          confirmPassword: "1234567",
        });
        expect(shortErrors.password).toBe("Password must be at least 8 characters long");

        // Exactly 8 characters (boundary)
        const exact8Errors = validateSignupForm({
          fullName: "Valid Name",
          email: "test@example.com",
          password: "12345678",
          confirmPassword: "12345678",
        });
        expect(exact8Errors.password).toBeUndefined();
      });
    });

    describe("Case Insensitivity & Whitespace Trimming", () => {
      it("validates uppercase and mixed-case email addresses", () => {
        const upperErrors = validateSignupForm({
          fullName: "Test Student",
          email: "STUDENT.ALPHA@UNIVERSITY.EDU",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(upperErrors.email).toBeUndefined();

        const mixedErrors = validateSignupForm({
          fullName: "Test Student",
          email: "StUdEnT+TaG@ExAmPlE.cO.uK",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(mixedErrors.email).toBeUndefined();
      });

      it("trims leading and trailing whitespace from email and full name", () => {
        const paddedErrors = validateSignupForm({
          fullName: "   Jane Doe   ",
          email: "   jane.doe@quizlet.com   ",
          password: "password123",
          confirmPassword: "password123",
        });
        expect(paddedErrors.fullName).toBeUndefined();
        expect(paddedErrors.email).toBeUndefined();
      });

      it("rejects whitespace-only full name and username inputs", () => {
        const loginErrors = validateLoginForm({
          username: "    \t\n   ",
          password: "validPassword",
        });
        expect(loginErrors.username).toBe("Email or username is required");

        const signupErrors = validateSignupForm({
          fullName: "    \t   ",
          email: "user@test.com",
          password: "validPassword",
          confirmPassword: "validPassword",
        });
        expect(signupErrors.fullName).toBe("Full name is required");
      });

      it("rejects full name that trims down to 1 character", () => {
        const errors = validateSignupForm({
          fullName: "   A   ",
          email: "user@test.com",
          password: "validPassword",
          confirmPassword: "validPassword",
        });
        expect(errors.fullName).toBe("Full name must be at least 2 characters");
      });
    });

    describe("Confirm Password Edge Cases", () => {
      it("rejects empty confirm password when password is provided", () => {
        const errors = validateSignupForm({
          fullName: "Student",
          email: "student@test.com",
          password: "SecurePassword123!",
          confirmPassword: "",
        });
        expect(errors.confirmPassword).toBe("Confirm password is required");
      });

      it("rejects case-sensitive mismatch between password and confirmPassword", () => {
        const errors = validateSignupForm({
          fullName: "Student",
          email: "student@test.com",
          password: "SecurePassword123!",
          confirmPassword: "securepassword123!",
        });
        expect(errors.confirmPassword).toBe("Passwords do not match");
      });

      it("ignores confirmPassword when undefined (partial form usage)", () => {
        const errors = validateSignupForm({
          fullName: "Student",
          email: "student@test.com",
          password: "SecurePassword123!",
        });
        expect(errors.confirmPassword).toBeUndefined();
      });
    });
  });

  /* ==========================================================================
     3. Form Interaction Edge Cases, In-Flight States & Server Error Handling
     ========================================================================== */
  describe("Form Interaction Edge Cases & Server Error Banners", () => {
    describe("Rapid Double-Submission and In-Flight State", () => {
      it("disables submit button and input fields while login is in flight", async () => {
        let resolveLogin: (val: unknown) => void = () => {};
        const loginPromise = new Promise((resolve) => {
          resolveLogin = resolve;
        });
        mockLogin.mockReturnValueOnce(loginPromise);

        render(<LoginForm />);

        const usernameInput = screen.getByLabelText(/Email or username/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
        const submitBtn = screen.getByRole("button", { name: "Log in" }) as HTMLButtonElement;

        fireEvent.change(usernameInput, { target: { value: "test@quizlet.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });

        // Trigger submission
        fireEvent.click(submitBtn);

        // While promise is in flight:
        await waitFor(() => {
          expect(submitBtn.disabled).toBe(true);
          expect(usernameInput.disabled).toBe(true);
          expect(passwordInput.disabled).toBe(true);
        });

        // Rapid second click attempt on the disabled button should not trigger another login call
        fireEvent.click(submitBtn);
        expect(mockLogin).toHaveBeenCalledTimes(1);

        // Resolve request
        resolveLogin({ id: "usr_1" });
        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith("/");
        });
      });

      it("disables submit button and input fields while signup is in flight", async () => {
        let resolveSignup: (val: unknown) => void = () => {};
        const signupPromise = new Promise((resolve) => {
          resolveSignup = resolve;
        });
        mockSignup.mockReturnValueOnce(signupPromise);

        render(<SignupForm />);

        const nameInput = screen.getByLabelText(/Full name/i) as HTMLInputElement;
        const emailInput = screen.getByLabelText(/Email address/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
        const confirmInput = screen.getByLabelText(/^Confirm password$/i) as HTMLInputElement;
        const submitBtn = screen.getByRole("button", { name: "Create account" }) as HTMLButtonElement;

        fireEvent.change(nameInput, { target: { value: "Sam Student" } });
        fireEvent.change(emailInput, { target: { value: "sam@quizlet.com" } });
        fireEvent.change(passwordInput, { target: { value: "Password123!" } });
        fireEvent.change(confirmInput, { target: { value: "Password123!" } });

        fireEvent.click(submitBtn);

        // In-flight assertion
        await waitFor(() => {
          expect(submitBtn.disabled).toBe(true);
          expect(nameInput.disabled).toBe(true);
          expect(emailInput.disabled).toBe(true);
          expect(passwordInput.disabled).toBe(true);
          expect(confirmInput.disabled).toBe(true);
        });

        // Second click
        fireEvent.click(submitBtn);
        expect(mockSignup).toHaveBeenCalledTimes(1);

        resolveSignup({ id: "usr_new" });
        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith("/");
        });
      });
    });

    describe("Server Error Banner States and Recovery", () => {
      it("renders 500 Internal Server Error, re-enables form, and allows user to retry", async () => {
        mockLogin.mockRejectedValueOnce({
          status: 500,
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error occurred",
        });

        render(<LoginForm />);

        const usernameInput = screen.getByLabelText(/Email or username/i);
        const passwordInput = screen.getByLabelText(/^Password/i);
        const submitBtn = screen.getByRole("button", { name: "Log in" });

        fireEvent.change(usernameInput, { target: { value: "user@test.com" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });
        fireEvent.click(submitBtn);

        // Verify error banner is displayed
        await waitFor(() => {
          const alert = screen.getByRole("alert");
          expect(alert).toBeDefined();
          expect(alert.textContent).toContain("Internal server error occurred");
        });

        // Form inputs and button are unlocked for retry
        expect((submitBtn as HTMLButtonElement).disabled).toBe(false);
        expect((usernameInput as HTMLInputElement).disabled).toBe(false);
        expect((passwordInput as HTMLInputElement).disabled).toBe(false);

        // Retry succeeds
        mockLogin.mockResolvedValueOnce({ id: "usr_1" });
        fireEvent.click(submitBtn);

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith("/");
        });
      });

      it("renders ACCOUNT_LOCKED (429) message when rate limited", async () => {
        mockLogin.mockRejectedValueOnce({
          status: 429,
          code: "ACCOUNT_LOCKED",
          message: "Too many attempts",
        });

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/Email or username/i), {
          target: { value: "locked@test.com" },
        });
        fireEvent.change(screen.getByLabelText(/^Password/i), {
          target: { value: "password123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Log in" }));

        await waitFor(() => {
          const alert = screen.getByRole("alert");
          expect(alert.textContent).toContain(
            "Your account has been temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."
          );
        });
      });

      it("renders USER_BANNED (403) suspension message", async () => {
        mockLogin.mockRejectedValueOnce({
          status: 403,
          code: "USER_BANNED",
          message: "User is suspended",
        });

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/Email or username/i), {
          target: { value: "banned@test.com" },
        });
        fireEvent.change(screen.getByLabelText(/^Password/i), {
          target: { value: "password123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Log in" }));

        await waitFor(() => {
          const alert = screen.getByRole("alert");
          expect(alert.textContent).toContain(
            "Your account has been suspended. Please contact customer support."
          );
        });
      });

      it("renders USER_NOT_CONFIRMED message when email is unverified", async () => {
        mockLogin.mockRejectedValueOnce({
          status: 401,
          code: "USER_NOT_CONFIRMED",
          message: "Email not confirmed",
        });

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/Email or username/i), {
          target: { value: "unconfirmed@test.com" },
        });
        fireEvent.change(screen.getByLabelText(/^Password/i), {
          target: { value: "password123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Log in" }));

        await waitFor(() => {
          const alert = screen.getByRole("alert");
          expect(alert.textContent).toContain(
            "Please confirm your email address before logging in. Check your inbox for the activation link."
          );
        });
      });

      it("dismisses error banner when close button is clicked", async () => {
        mockLogin.mockRejectedValueOnce({
          code: "INVALID_CREDENTIALS",
          message: "invalid credentials",
        });

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/Email or username/i), {
          target: { value: "wrong@test.com" },
        });
        fireEvent.change(screen.getByLabelText(/^Password/i), {
          target: { value: "wrongPassword" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Log in" }));

        await waitFor(() => {
          expect(screen.getByRole("alert")).toBeDefined();
        });

        // Click dismiss button
        const dismissBtn = screen.getByLabelText("Dismiss alert");
        fireEvent.click(dismissBtn);

        expect(screen.queryByRole("alert")).toBeNull();
      });

      it("handles network offline / fetch failure gracefully", async () => {
        mockLogin.mockRejectedValueOnce(new TypeError("Failed to fetch"));

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/Email or username/i), {
          target: { value: "offline@test.com" },
        });
        fireEvent.change(screen.getByLabelText(/^Password/i), {
          target: { value: "password123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Log in" }));

        await waitFor(() => {
          const alert = screen.getByRole("alert");
          expect(alert.textContent).toContain("Failed to fetch");
        });

        // Form remains usable
        expect((screen.getByRole("button", { name: "Log in" }) as HTMLButtonElement).disabled).toBe(false);
      });
    });

    describe("Interactive Password Visibility Toggling during typing", () => {
      it("preserves input values across repeated visibility toggles and updates accessibility state", () => {
        render(<LoginForm />);

        const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
        const toggleBtn = screen.getByLabelText("Show password");

        // Initial state
        expect(passwordInput.type).toBe("password");
        expect(toggleBtn.getAttribute("aria-pressed")).toBe("false");

        // Type first part of password
        fireEvent.change(passwordInput, { target: { value: "MySecure" } });
        expect(passwordInput.value).toBe("MySecure");

        // Toggle to visible
        fireEvent.click(toggleBtn);
        expect(passwordInput.type).toBe("text");
        const hideBtn = screen.getByLabelText("Hide password");
        expect(hideBtn.getAttribute("aria-pressed")).toBe("true");

        // Type remaining characters while visible
        fireEvent.change(passwordInput, { target: { value: "MySecurePass!99" } });
        expect(passwordInput.value).toBe("MySecurePass!99");

        // Toggle back to hidden
        fireEvent.click(hideBtn);
        expect(passwordInput.type).toBe("password");
        expect(screen.getByLabelText("Show password").getAttribute("aria-pressed")).toBe("false");
        expect(passwordInput.value).toBe("MySecurePass!99");
      });

      it("allows independent visibility toggling for password and confirmPassword in SignupForm", () => {
        render(<SignupForm />);

        const passwordInput = screen.getByLabelText(/^Password/i) as HTMLInputElement;
        const confirmInput = screen.getByLabelText(/^Confirm password$/i) as HTMLInputElement;

        const showButtons = screen.getAllByLabelText("Show password");
        const passwordToggle = showButtons[0];
        const confirmToggle = screen.getByLabelText("Show confirm password");

        // Both start hidden
        expect(passwordInput.type).toBe("password");
        expect(confirmInput.type).toBe("password");

        // Toggle only the main password
        fireEvent.click(passwordToggle);
        expect(passwordInput.type).toBe("text");
        expect(confirmInput.type).toBe("password");

        // Toggle the confirm password
        fireEvent.click(confirmToggle);
        expect(passwordInput.type).toBe("text");
        expect(confirmInput.type).toBe("text");

        // Hide main password only
        fireEvent.click(screen.getByLabelText("Hide password"));
        expect(passwordInput.type).toBe("password");
        expect(confirmInput.type).toBe("text");

        // Hide confirm password
        fireEvent.click(screen.getByLabelText("Hide confirm password"));
        expect(passwordInput.type).toBe("password");
        expect(confirmInput.type).toBe("password");
      });
    });

    describe("Input Trimming on Submission", () => {
      it("trims username before calling login", async () => {
        mockLogin.mockResolvedValueOnce({ id: "usr_1" });
        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/Email or username/i), {
          target: { value: "   student@quizlet.com   " },
        });
        fireEvent.change(screen.getByLabelText(/^Password/i), {
          target: { value: "  passWithSpacesPreserved  " },
        });
        fireEvent.click(screen.getByRole("button", { name: "Log in" }));

        await waitFor(() => {
          expect(mockLogin).toHaveBeenCalledWith({
            username: "student@quizlet.com", // trimmed
            password: "  passWithSpacesPreserved  ", // password spaces preserved
          });
        });
      });

      it("trims email and full name before calling signup", async () => {
        mockSignup.mockResolvedValueOnce({ id: "usr_1" });
        render(<SignupForm />);

        fireEvent.change(screen.getByLabelText(/Full name/i), {
          target: { value: "   Alex Johnson   " },
        });
        fireEvent.change(screen.getByLabelText(/Email address/i), {
          target: { value: "   alex@quizlet.com   " },
        });
        fireEvent.change(screen.getByLabelText(/^Password/i), {
          target: { value: "Password123!" },
        });
        fireEvent.change(screen.getByLabelText(/^Confirm password$/i), {
          target: { value: "Password123!" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));

        await waitFor(() => {
          expect(mockSignup).toHaveBeenCalledWith({
            full_name: "Alex Johnson", // trimmed
            email: "alex@quizlet.com", // trimmed
            password: "Password123!",
          });
        });
      });
    });
  });
});

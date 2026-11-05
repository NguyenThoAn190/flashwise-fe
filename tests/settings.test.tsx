import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsContent } from "@/components/settings/SettingsContent";
import SettingsPage from "@/app/[locale]/(dashboard)/settings/page";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/settings",
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={typeof href === "string" ? href : "/"}>{children}</a>
  ),
  redirect: vi.fn(),
  usePathname: () => "/settings",
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  getPathname: () => "/settings",
}));

const mockUser = {
  id: "usr_test_101",
  email: "student@flashwise.local",
  username: "flashwisestudent",
  full_name: "Flashwise Student",
  stats: { current_streak: 7 },
};

vi.mock("@/lib/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

describe("Settings page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders subscription, personal info and account sections from real profile", () => {
    render(<SettingsContent />);

    expect(screen.getByTestId("settings-page")).toBeInTheDocument();
    expect(screen.getByTestId("settings-subscription")).toBeInTheDocument();
    expect(screen.getByTestId("settings-plan-row")).toBeInTheDocument();

    // Thông tin cá nhân hiển thị đúng user thật
    expect(screen.getByTestId("settings-email-value")).toHaveTextContent(
      "student@flashwise.local"
    );
    expect(screen.getByTestId("settings-username-value")).toHaveTextContent(
      "flashwisestudent"
    );
  });

  it("marks unfinished features as coming soon and keeps destructive action disabled", () => {
    render(<SettingsContent />);

    const badges = screen.getAllByTestId("settings-coming-soon");
    // Gói đăng ký, sửa tên/email, theme, 7 hàng thông báo, mật khẩu, facebook,
    // 2 toggle riêng tư, xóa tài khoản: phải có nhiều badge
    expect(badges.length).toBeGreaterThan(10);

    // Nút Sửa / Tạo mật khẩu / Xóa tài khoản đều disabled
    expect(screen.getByTestId("settings-username-edit")).toBeDisabled();
    expect(screen.getByTestId("settings-email-edit")).toBeDisabled();
    expect(screen.getByTestId("settings-password-create")).toBeDisabled();
    const deleteBtn = screen.getByTestId("settings-delete-account");
    expect(deleteBtn).toBeDisabled();

    // Toggle quyền riêng tư ở trạng thái disabled
    const toggles = screen.getAllByTestId("settings-toggle");
    expect(toggles.length).toBe(2);
    toggles.forEach((toggle) => expect(toggle).toBeDisabled());
  });

  it("embeds the real language switcher so locale change stays on settings", () => {
    render(<SettingsContent />);

    // LanguageSwitcher variant=list render đủ 5 locale
    expect(screen.getByTestId("language-option-vi")).toBeInTheDocument();
    expect(screen.getByTestId("language-option-en")).toBeInTheDocument();
    expect(screen.getByTestId("language-option-ja")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("language-option-ja"));
    expect(mockReplace).toHaveBeenCalledWith("/settings", { locale: "ja" });
  });

  it("renders through the dashboard settings route inside AuthGuard", () => {
    render(<SettingsPage />);

    expect(screen.getByTestId("settings-page")).toBeInTheDocument();
    expect(screen.getByTestId("settings-appearance")).toBeInTheDocument();
    expect(screen.getByTestId("settings-notifications")).toBeInTheDocument();
    expect(screen.getByTestId("settings-account")).toBeInTheDocument();
  });
});

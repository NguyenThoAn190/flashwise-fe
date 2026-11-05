"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Mail } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { SettingsSection } from "./SettingsSection";
import { SettingsRow } from "./SettingsRow";
import { ComingSoonBadge } from "./ComingSoonBadge";
import { cn } from "@/lib/utils/cn";

function initialsFor(fullName?: string, username?: string): string {
  if (fullName) {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return username?.slice(0, 2).toUpperCase() || "U";
}

function DisabledMailButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      title={label}
      data-testid="settings-notif-mail"
      className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-quizlet-border-light text-quizlet-indigo bg-white opacity-60 cursor-not-allowed"
    >
      <Mail className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}

function DisabledToggle({ on, label }: { on: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled
      data-testid="settings-toggle"
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-not-allowed opacity-70",
        on ? "bg-quizlet-indigo justify-end" : "bg-quizlet-border justify-start"
      )}
    >
      <span className="mx-0.5 h-5 w-5 rounded-full bg-white shadow" />
    </button>
  );
}

function Collapsible({
  title,
  children,
  testId,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  testId: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5 cursor-pointer"
      >
        <span className="text-sm font-bold text-quizlet-slate">{title}</span>
        <ChevronDown
          className={cn("w-4 h-4 text-quizlet-slate-muted transition-transform", !open && "-rotate-90")}
          aria-hidden="true"
        />
      </button>
      {open ? <div className="pb-1">{children}</div> : null}
    </div>
  );
}

/**
 * Toàn bộ nội dung trang Cài đặt. Đọc profile thật từ `useAuth()`,
 * Ngôn ngữ hoạt động thật, mọi thứ còn lại ở trạng thái disabled + badge Sắp ra mắt.
 */
export function SettingsContent() {
  const t = useTranslations("settings");
  const { user } = useAuth();
  const initials = initialsFor(user?.full_name, user?.username);

  return (
    <div data-testid="settings-page" className="max-w-3xl mx-auto py-6 sm:py-8 px-4 space-y-8">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-quizlet-slate">{t("title")}</h1>

      {/* 1. Gói đăng ký — văn bản tĩnh + badge */}
      <SettingsSection label={t("subscription")} testId="settings-subscription">
        <SettingsRow
          testId="settings-plan-row"
          label={t("planName")}
          subLabel={t("planDesc")}
          control={<ComingSoonBadge feature={t("subscription")} />}
        />
      </SettingsSection>

      {/* 2. Thông tin cá nhân — chỉ hiển thị */}
      <SettingsSection label={t("personalInfo")} testId="settings-personal">
        <div className="px-4 sm:px-5 py-4 border-b border-quizlet-border-light">
          <p className="text-sm font-bold text-quizlet-slate mb-3">{t("profilePhoto")}</p>
          <div className="flex items-start gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-16 h-16 rounded-full object-cover border border-quizlet-border shrink-0"
                data-testid="settings-avatar-img"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full bg-quizlet-canvas border border-quizlet-border-light flex items-center justify-center text-xl font-extrabold text-quizlet-slate shrink-0"
                data-testid="settings-avatar-fallback"
              >
                {initials}
              </div>
            )}
            <div
              aria-hidden="true"
              data-testid="settings-avatar-grid"
              title={t("avatarNote")}
              className="flex-1 flex flex-wrap gap-2 opacity-60 select-none"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className="w-8 h-8 rounded-full bg-quizlet-canvas border border-quizlet-border-light inline-block"
                />
              ))}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-quizlet-slate-secondary">
            {t("avatarNote")}
            <ComingSoonBadge feature={t("profilePhoto")} />
          </p>
        </div>
        <SettingsRow
          testId="settings-username-row"
          label={t("username")}
          subLabel={user?.username ?? user?.full_name ?? "—"}
          control={
            <>
              <span
                data-testid="settings-username-value"
                className="text-xs text-quizlet-slate-secondary truncate max-w-40"
              >
                {user?.username ?? user?.full_name ?? "—"}
              </span>
              <button
                type="button"
                disabled
                data-testid="settings-username-edit"
                aria-label={t("comingSoonAria", { feature: t("username") })}
                title={t("comingSoonAria", { feature: t("username") })}
                className="text-sm font-bold text-quizlet-indigo opacity-50 cursor-not-allowed"
              >
                {t("edit")}
              </button>
              <ComingSoonBadge feature={t("username")} />
            </>
          }
        />
        <SettingsRow
          testId="settings-email-row"
          label={t("email")}
          subLabel={user?.email ?? "—"}
          control={
            <>
              <span
                data-testid="settings-email-value"
                className="text-xs text-quizlet-slate-secondary truncate max-w-40"
              >
                {user?.email ?? "—"}
              </span>
              <button
                type="button"
                disabled
                data-testid="settings-email-edit"
                aria-label={t("comingSoonAria", { feature: t("email") })}
                title={t("comingSoonAria", { feature: t("email") })}
                className="text-sm font-bold text-quizlet-indigo opacity-50 cursor-not-allowed"
              >
                {t("edit")}
              </button>
              <ComingSoonBadge feature={t("email")} />
            </>
          }
        />
      </SettingsSection>

      {/* 3. Giao diện — Hình nền disabled, Ngôn ngữ hoạt động thật */}
      <SettingsSection label={t("appearance")} testId="settings-appearance">
        <SettingsRow
          testId="settings-theme-row"
          label={t("theme")}
          control={
            <>
              <span
                data-testid="settings-theme-value"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-quizlet-canvas border border-quizlet-border-light text-xs font-bold text-quizlet-slate"
              >
                {t("themeAuto")}
                <ChevronDown className="w-3.5 h-3.5 text-quizlet-slate-muted" aria-hidden="true" />
              </span>
              <ComingSoonBadge feature={t("theme")} />
            </>
          }
        />
        <div className="px-4 sm:px-5 py-3.5">
          <p className="text-sm font-bold text-quizlet-slate mb-2">{t("language")}</p>
          <LanguageSwitcher variant="list" showLabel={false} />
        </div>
      </SettingsSection>

      {/* 4. Thông báo — toàn bộ toggle/mail disabled */}
      <SettingsSection label={t("notifications")} testId="settings-notifications">
        <Collapsible title={t("personalizedUpdates")} testId="settings-notif-personalized">
          <SettingsRow
            label={t("streak")}
            control={
              <>
                <DisabledMailButton label={t("streak")} />
                <ComingSoonBadge feature={t("streak")} />
              </>
            }
          />
          <SettingsRow
            label={t("groupActivities")}
            control={
              <>
                <DisabledMailButton label={t("groupActivities")} />
                <ComingSoonBadge feature={t("groupActivities")} />
              </>
            }
          />
          <SettingsRow
            label={t("studyReminders")}
            control={
              <>
                <DisabledMailButton label={t("studyReminders")} />
                <ComingSoonBadge feature={t("studyReminders")} />
              </>
            }
          />
          <SettingsRow
            label={t("reminderTime")}
            control={
              <>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-quizlet-canvas border border-quizlet-border-light text-xs font-bold text-quizlet-slate">
                  {t("reminderTimeValue")}
                  <ChevronDown className="w-3.5 h-3.5 text-quizlet-slate-muted" aria-hidden="true" />
                </span>
                <ComingSoonBadge feature={t("reminderTime")} />
              </>
            }
          />
          <SettingsRow
            label={t("timezone")}
            control={
              <>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-quizlet-canvas border border-quizlet-border-light text-xs font-bold text-quizlet-slate max-w-56 truncate">
                  {t("timezoneValue")}
                  <ChevronDown
                    className="w-3.5 h-3.5 text-quizlet-slate-muted shrink-0"
                    aria-hidden="true"
                  />
                </span>
                <ComingSoonBadge feature={t("timezone")} />
              </>
            }
          />
        </Collapsible>
        <div className="border-t border-quizlet-border-light" />
        <Collapsible title={t("flashwiseNews")} testId="settings-notif-news">
          <SettingsRow
            label={t("newFeatures")}
            control={
              <>
                <DisabledMailButton label={t("newFeatures")} />
                <ComingSoonBadge feature={t("newFeatures")} />
              </>
            }
          />
          <SettingsRow
            label={t("offers")}
            control={
              <>
                <DisabledMailButton label={t("offers")} />
                <ComingSoonBadge feature={t("offers")} />
              </>
            }
          />
        </Collapsible>
      </SettingsSection>

      {/* 5. Tài khoản và quyền riêng tư */}
      <SettingsSection label={t("privacy")} testId="settings-account">
        <SettingsRow
          testId="settings-password-row"
          label={t("createPassword")}
          control={
            <>
              <button
                type="button"
                disabled
                data-testid="settings-password-create"
                aria-label={t("comingSoonAria", { feature: t("createPassword") })}
                title={t("comingSoonAria", { feature: t("createPassword") })}
                className="text-sm font-bold text-quizlet-indigo opacity-50 cursor-not-allowed"
              >
                {t("create")}
              </button>
              <ComingSoonBadge feature={t("createPassword")} />
            </>
          }
        />
        <SettingsRow
          testId="settings-facebook-row"
          label={t("connectFacebook")}
          control={
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-quizlet-canvas border border-quizlet-border-light text-xs font-bold text-quizlet-slate">
                {t("linkFacebook")}
              </span>
              <ComingSoonBadge feature={t("connectFacebook")} />
            </>
          }
        />
        <div className="px-4 sm:px-5 pt-3 pb-1">
          <p className="text-sm font-bold text-quizlet-slate">{t("privacyRights")}</p>
        </div>
        <SettingsRow
          label={t("showRealName")}
          control={
            <>
              <DisabledToggle on label={t("showRealName")} />
              <ComingSoonBadge feature={t("showRealName")} />
            </>
          }
        />
        <SettingsRow
          label={t("showOnGoogle")}
          control={
            <>
              <DisabledToggle on={false} label={t("showOnGoogle")} />
              <ComingSoonBadge feature={t("showOnGoogle")} />
            </>
          }
        />
        <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-quizlet-slate">{t("deleteAccount")}</p>
            <p className="text-xs text-quizlet-slate-secondary mt-0.5">{t("deleteDesc")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled
              data-testid="settings-delete-account"
              aria-label={t("comingSoonAria", { feature: t("deleteAccount") })}
              title={t("comingSoonAria", { feature: t("deleteAccount") })}
              className="px-4 py-2 rounded-xl bg-quizlet-coral text-white text-sm font-bold opacity-50 cursor-not-allowed"
            >
              {t("deleteButton")}
            </button>
            <ComingSoonBadge feature={t("deleteAccount")} />
          </div>
        </div>
      </SettingsSection>

      <footer className="flex items-center justify-between text-xs text-quizlet-slate-secondary px-1">
        <div className="flex items-center gap-4">
          <span className="cursor-not-allowed opacity-70">{t("footerPrivacy")}</span>
          <span className="cursor-not-allowed opacity-70">{t("footerTerms")}</span>
        </div>
        <LanguageSwitcher variant="icon" showLabel={false} />
      </footer>
    </div>
  );
}

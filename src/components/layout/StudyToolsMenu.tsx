"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Dropdown, DropdownLabel } from "@/components/ui/Dropdown";
import {
  Layers,
  Brain,
  ClipboardCheck,
  Users,
  Radio,
  Clock,
  BarChart3,
  ChevronDown,
} from "lucide-react";

function ToolRow({
  icon,
  accent,
  title,
  desc,
  badge,
  disabled,
  onClick,
  testId,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  desc: string;
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      data-testid={testId}
      onClick={onClick}
      className="w-full px-2.5 py-2 flex items-center gap-3 rounded-lg text-left transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 hover:bg-quizlet-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quizlet-indigo"
    >
      <span
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-quizlet-slate">{title}</span>
          {badge ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-quizlet-canvas text-quizlet-slate-muted">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="block text-xs text-quizlet-slate-secondary truncate">
          {desc}
        </span>
      </span>
    </button>
  );
}

/**
 * Menu "Công cụ học" kiểu Flashwise: nhóm Học sinh / Giáo viên,
 * chỉ liệt kê thứ app đã có, món chưa có ghi "Sắp có" + disabled.
 * Thay link "Thư viện của bạn" trên menu công khai.
 */
export function StudyToolsMenu() {
  const t = useTranslations("nav");
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  const go = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <Dropdown
      align="left"
      className="w-72 p-1.5"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <span
          data-testid="study-tools-trigger"
          className="h-9 inline-flex items-center justify-center gap-1 px-3 rounded-lg whitespace-nowrap font-sans text-sm font-semibold leading-5 tracking-normal antialiased text-quizlet-slate hover:text-quizlet-indigo hover:bg-quizlet-canvas transition-colors"
        >
          {t("studyTools")}
          <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        </span>
      }
    >
      <div role="group" aria-label={t("studyTools")}>
        <DropdownLabel>{t("forStudents")}</DropdownLabel>
        <ToolRow
          testId="study-tool-flashcards"
          icon={<Layers className="w-4 h-4" />}
          accent="bg-quizlet-indigo-light text-quizlet-indigo"
          title={t("toolsFlashcards")}
          desc={t("toolsFlashcardsDesc")}
          onClick={() => go("/tools/flashcards")}
        />
        <ToolRow
          testId="study-tool-learn"
          icon={<Brain className="w-4 h-4" />}
          accent="bg-quizlet-green-bg text-quizlet-green"
          title={t("toolsLearn")}
          desc={t("toolsLearnDesc")}
          onClick={() => go("/tools/learn")}
        />
        <ToolRow
          testId="study-tool-srs"
          icon={<Clock className="w-4 h-4" />}
          accent="bg-quizlet-warning-bg text-quizlet-warning"
          title={t("toolsSRS")}
          desc={t("toolsSRSDesc")}
          onClick={() => go("/tools/srs")}
        />
        <ToolRow
          testId="study-tool-progress"
          icon={<BarChart3 className="w-4 h-4" />}
          accent="bg-quizlet-indigo-light text-quizlet-indigo"
          title={t("toolsProgress")}
          desc={t("toolsProgressDesc")}
          onClick={() => go("/tools/progress")}
        />
        <ToolRow
          testId="study-tool-test"
          icon={<ClipboardCheck className="w-4 h-4" />}
          accent="bg-quizlet-canvas text-quizlet-slate-muted"
          title={t("toolsTest")}
          desc={t("toolsTestDesc")}
          badge={t("comingSoon")}
          onClick={() => go("/tools/test")}
        />
        <ToolRow
          testId="study-tool-groups"
          icon={<Users className="w-4 h-4" />}
          accent="bg-quizlet-canvas text-quizlet-slate-muted"
          title={t("toolsGroups")}
          desc={t("toolsGroupsDesc")}
          badge={t("comingSoon")}
          onClick={() => go("/tools/groups")}
        />
        <div className="h-px bg-quizlet-border-light my-1" role="separator" />
        <DropdownLabel>{t("forTeachers")}</DropdownLabel>
        <ToolRow
          testId="study-tool-live"
          icon={<Radio className="w-4 h-4" />}
          accent="bg-quizlet-canvas text-quizlet-slate-muted"
          title={t("toolsLive")}
          desc={t("toolsLiveDesc")}
          badge={t("comingSoon")}
          onClick={() => go("/tools/live")}
        />
      </div>
    </Dropdown>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { apiCreateStudySet } from "@/lib/api/studySets";
import {
  StudySetEditorForm,
  StudySetEditorSubmitData,
} from "@/components/editor/StudySetEditorForm";

export default function CreateStudySetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: StudySetEditorSubmitData) => {
    setIsSubmitting(true);
    try {
      const created = await apiCreateStudySet({
        title: data.title,
        description: data.description,
        visibility: data.visibility,
        cards: data.cards.map((c) => ({
          front_content: c.front_content,
          back_content: c.back_content,
          hint: c.hint,
        })),
      });
      router.push(`/set/${created.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div
        data-testid="create-study-set-page"
        className="max-w-5xl mx-auto py-6 sm:py-8 px-4 space-y-6"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-quizlet-slate-secondary hover:text-quizlet-indigo transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <StudySetEditorForm
          mode="create"
          draftKey="quizlet_set_draft_create"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/")}
          isSubmitting={isSubmitting}
        />
      </div>
    </AuthGuard>
  );
}

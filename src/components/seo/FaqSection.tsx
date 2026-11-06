import React from "react";
import type { FaqItem } from "@/lib/seo/faq";

export function FaqSection({
  items,
  heading = "Câu hỏi thường gặp",
  testId = "landing-faq",
}: {
  items: FaqItem[];
  heading?: string;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className="w-full bg-white border-t border-quizlet-border-light"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-quizlet-indigo">
            FAQ
          </p>
          <h2 className="font-hurme text-[24px] sm:text-[32px] font-bold text-quizlet-slate tracking-normal leading-tight">
            {heading}
          </h2>
        </div>
        <div className="mt-8 grid gap-3">
          {items.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-quizlet-border-light bg-quizlet-surface p-5"
            >
              <summary className="cursor-pointer font-bold text-quizlet-slate list-none flex items-center justify-between gap-4">
                {f.q}
                <span aria-hidden="true" className="text-quizlet-indigo group-open:rotate-45 text-xl leading-none">+</span>
              </summary>
              <p className="mt-2 text-sm text-quizlet-slate-secondary leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

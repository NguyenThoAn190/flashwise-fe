"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain } from "lucide-react";
import {
  apiStartSession,
  apiGetNextQuestion,
  apiSubmitAnswer,
  apiRateCardSRS,
  apiCompleteSession,
  AdaptiveQuestion,
  SubmitAnswerResult,
  SessionSummaryData,
  SRSRating,
} from "@/lib/api/sessions";
import { MultipleChoiceQuestion } from "@/components/learn/MultipleChoiceQuestion";
import { TrueFalseQuestion } from "@/components/learn/TrueFalseQuestion";
import { WrittenQuestion } from "@/components/learn/WrittenQuestion";
import { FlashcardRecallQuestion } from "@/components/learn/FlashcardRecallQuestion";
import { FeedbackBanner } from "@/components/learn/FeedbackBanner";
import { SRSRatingBar } from "@/components/learn/SRSRatingBar";
import { SessionSummary } from "@/components/learn/SessionSummary";
import { Button } from "@/components/ui/Button";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function LearnSessionPage() {
  const params = useParams();
  const router = useRouter();
  const setId = typeof params?.id === "string" ? params.id : "";

  const [sessionId, setSessionId] = useState<string>("");
  const [question, setQuestion] = useState<AdaptiveQuestion | null>(null);
  const [feedback, setFeedback] = useState<SubmitAnswerResult | null>(null);
  const [submittedDisplay, setSubmittedDisplay] = useState<string>("");
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNextStep = useCallback(async (activeSessionId: string) => {
    setFeedback(null);
    setSubmittedDisplay("");
    const nextRes = await apiGetNextQuestion(activeSessionId);
    if (nextRes.is_completed) {
      setQuestion(null);
      setSummary(nextRes.summary);
    } else {
      setQuestion(nextRes);
    }
  }, []);

  const initSession = useCallback(async () => {
    if (!setId) return;
    setIsLoading(true);
    setError(null);
    setSummary(null);
    setFeedback(null);
    setQuestion(null);
    try {
      const started = await apiStartSession(setId, {
        mode: "learn",
        direction: "term_first",
      });
      setSessionId(started.session_id);
      await fetchNextStep(started.session_id);
    } catch (err: any) {
      setError(err?.message || "Failed to start Learn session.");
    } finally {
      setIsLoading(false);
    }
  }, [setId, fetchNextStep]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const handleAnswer = async (
    rawAnswer: string | number | boolean,
    displayLabel: string
  ) => {
    if (!sessionId || !question || isSubmitting) return;
    setIsSubmitting(true);
    setSubmittedDisplay(displayLabel);
    try {
      const res = await apiSubmitAnswer(sessionId, {
        question_id: question.question_id,
        card_id: question.card_id,
        question_type: question.question_type,
        answer: rawAnswer,
      });
      setFeedback(res);
    } catch (err: any) {
      setError(err?.message || "Failed to evaluate answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (!sessionId) return;
    if (feedback?.is_session_completed) {
      try {
        const nextRes = await apiGetNextQuestion(sessionId);
        if (nextRes.is_completed) {
          setSummary(nextRes.summary);
          setQuestion(null);
          setFeedback(null);
          return;
        }
      } catch {
        const comp = await apiCompleteSession(sessionId);
        setSummary(comp);
        setQuestion(null);
        setFeedback(null);
        return;
      }
    }
    await fetchNextStep(sessionId);
  };

  const handleRateSRS = async (rating: SRSRating) => {
    if (!sessionId || !question) return;
    return await apiRateCardSRS(sessionId, {
      card_id: question.card_id,
      rating,
    });
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div
          data-testid="learn-session-loading"
          className="max-w-4xl mx-auto py-8 px-4 space-y-6 animate-pulse"
        >
          <div className="h-6 w-48 bg-quizlet-border-light rounded" />
          <div className="h-80 w-full bg-quizlet-surface rounded-2xl border border-quizlet-border-light" />
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div
          data-testid="learn-session-error"
          className="max-w-3xl mx-auto py-12 px-4 text-center space-y-4"
        >
          <div className="bg-quizlet-surface rounded-2xl border border-quizlet-border-light p-8 shadow-card space-y-4">
            <h1 className="text-xl font-bold text-quizlet-coral">{error}</h1>
            <div className="flex justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => router.push(`/set/${setId}`)}
              >
                Back to Study Set
              </Button>
              <Button variant="primary" onClick={initSession}>
                Retry Session
              </Button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const totalCards = question?.total_cards || 1;
  const currentCardIdx = question?.card_index ?? 0;
  const progressPct = summary
    ? 100
    : Math.min(100, Math.round(((currentCardIdx + (feedback ? 1 : 0)) / totalCards) * 100));

  return (
    <AuthGuard>
      <div
        data-testid="learn-session-page"
        className="max-w-4xl mx-auto py-6 sm:py-8 px-4 space-y-6"
      >
      {/* Top Session Bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/set/${setId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-quizlet-slate-secondary hover:text-quizlet-indigo transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Learn Mode</span>
        </Link>

        <div className="inline-flex items-center gap-2 text-sm font-extrabold text-quizlet-indigo">
          <Brain className="w-4 h-4" />
          <span>Adaptive Learn</span>
          {!summary && question && (
            <span
              data-testid="learn-progress-counter"
              className="text-quizlet-slate-secondary ml-1"
            >
              ({currentCardIdx + 1} / {totalCards})
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-quizlet-border-light rounded-full overflow-hidden">
        <div
          data-testid="learn-progress-bar"
          className="h-full bg-quizlet-green transition-all duration-300 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Active Question or Summary */}
      {summary ? (
        <SessionSummary
          summary={summary}
          onRestart={initSession}
          onBackToSet={() => router.push(`/set/${setId}`)}
        />
      ) : (
        question && (
          <div className="space-y-6">
            {question.question_type === "mcq" && (
              <MultipleChoiceQuestion
                prompt={question.prompt}
                options={question.options || []}
                disabled={Boolean(feedback) || isSubmitting}
                onSelectOption={(_idx, optText) => handleAnswer(optText, optText)}
              />
            )}

            {question.question_type === "true_false" && (
              <TrueFalseQuestion
                prompt={question.prompt}
                proposedDefinition={question.proposed_definition || ""}
                disabled={Boolean(feedback) || isSubmitting}
                onAnswer={(choice) =>
                  handleAnswer(choice ? "True" : "False", choice ? "True" : "False")
                }
              />
            )}

            {question.question_type === "written" && (
              <WrittenQuestion
                prompt={question.prompt}
                disabled={Boolean(feedback) || isSubmitting}
                onSubmitAnswer={(txt) => handleAnswer(txt, txt)}
              />
            )}

            {question.question_type === "recall" && (
              <FlashcardRecallQuestion
                prompt={question.prompt}
                expectedAnswer={question.expected_answer || ""}
                disabled={Boolean(feedback) || isSubmitting}
                onSelfEvaluate={(remembered) =>
                  handleAnswer(
                    remembered ? "Remembered" : "Study again",
                    remembered ? "Remembered" : "Study again"
                  )
                }
              />
            )}

            {/* Instant Feedback */}
            {feedback && (
              <FeedbackBanner
                result={feedback}
                submittedAnswerText={submittedDisplay}
                onContinue={handleContinue}
              />
            )}
          </div>
        )
      )}
      </div>
    </AuthGuard>
  );
}

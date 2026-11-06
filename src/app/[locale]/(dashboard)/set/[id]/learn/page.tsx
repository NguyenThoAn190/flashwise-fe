"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
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
  const [chunkSizeSel, setChunkSizeSel] = useState<number>(12);
  const [chunkGateNotice, setChunkGateNotice] = useState<boolean>(false);

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
      setChunkGateNotice(Boolean(nextRes.chunk_gate_passed));
    }
  }, []);

  const initSession = useCallback(async (chunkIndex?: number) => {
    if (!setId) return;
    setIsLoading(true);
    setError(null);
    setSummary(null);
    setFeedback(null);
    setQuestion(null);
    setChunkGateNotice(false);
    try {
      const targetChunk = chunkIndex ?? Number(localStorage.getItem(`learn-chunk-${setId}`) || 0);
      const started = await apiStartSession(setId, {
        mode: "learn",
        direction: "term_first",
        chunk_size: chunkSizeSel,
        chunk_index: targetChunk,
      });
      setSessionId(started.session_id);
      try {
        localStorage.setItem(`learn-chunk-${setId}`, String(targetChunk));
      } catch {
        // ignore storage errors
      }
      await fetchNextStep(started.session_id);
    } catch (err: any) {
      setError(err?.message || "Failed to start Learn session.");
    } finally {
      setIsLoading(false);
    }
  }, [setId, fetchNextStep, chunkSizeSel]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Đổi cụm: học sinh chọn 8 / 12 / 15 rồi bắt đầu lại từ cụm đầu.
  // initSession phụ thuộc chunkSizeSel nên đổi selector sẽ tự restart qua useEffect.
  // Reset vị trí cụm về 0 để tránh kẹt index cũ khi đổi kích thước cụm.
  const handleChunkSizeChange = (size: number) => {
    try {
      localStorage.setItem(`learn-chunk-${setId}`, "0");
    } catch {
      // ignore storage errors
    }
    setChunkGateNotice(false);
    setChunkSizeSel(size);
  };

  const handleNextChunk = () => {
    const next = (question?.active_chunk ?? 0) + 1;
    const total = question?.total_chunks ?? 0;
    if (total > 0 && next >= total) return;
    initSession(next);
  };

  const handleRestartSameChunk = () => {
    initSession(question?.active_chunk ?? 0);
  };

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
              <Button variant="primary" onClick={() => initSession()}>
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

  const hasChunk = Boolean(question && (question.total_chunks ?? 0) > 0);
  const activeChunk = (question?.active_chunk ?? 0) + 1;
  const totalChunks = question?.total_chunks ?? 0;
  const chunkSize = question?.chunk_size ?? chunkSizeSel;
  const isReviewCard = Boolean(question?.is_review_card);
  const canGoNextChunk = hasChunk && totalChunks > 0 && activeChunk < totalChunks;
  // Vòng ôn tích lũy: cứ xong 3 cụm thì cụm mốc (4, 7, 10...) ép 3 câu đầu ôn từ cũ.
  const isCumulativeChunk =
    hasChunk && activeChunk > 1 && (activeChunk - 1) % 3 === 0;

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

      {/* Chunk controls + progress */}
      {!summary && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-quizlet-slate-secondary">Cụm:</span>
          {[8, 12, 15].map((size) => (
            <button
              key={size}
              type="button"
              data-testid={`chunk-size-${size}`}
              onClick={() => handleChunkSizeChange(size)}
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold border transition-colors ${
                chunkSizeSel === size
                  ? "bg-quizlet-indigo text-white border-quizlet-indigo"
                  : "bg-quizlet-surface text-quizlet-slate-secondary border-quizlet-border-light hover:border-quizlet-indigo"
              }`}
            >
              {size} từ
            </button>
          ))}
          {hasChunk && (
            <span data-testid="learn-chunk-counter" className="text-xs font-extrabold text-quizlet-indigo ml-auto">
              Cụm {activeChunk}/{totalChunks} · {chunkSize} từ/cụm
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full h-2 bg-quizlet-border-light rounded-full overflow-hidden">
        <div
          data-testid="learn-progress-bar"
          className="h-full bg-quizlet-green transition-all duration-300 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Review + gate notices */}
      {!summary && question && isCumulativeChunk && (
        <div
          data-testid="learn-cumulative-badge"
          className="rounded-xl border border-quizlet-indigo/40 bg-quizlet-indigo/10 px-4 py-2 text-sm font-bold text-quizlet-indigo"
        >
          Vòng ôn tích lũy: cụm {activeChunk} mở đầu bằng 3 câu ôn từ các cụm cũ trước khi học từ mới!
        </div>
      )}
      {!summary && question && isReviewCard && (
        <div
          data-testid="learn-review-badge"
          className="rounded-xl border border-quizlet-amber/40 bg-quizlet-amber/10 px-4 py-2 text-sm font-bold text-quizlet-amber"
        >
          Đang ôn {`30%`} từ cụm cũ để chống quên — trả lời chắc nhé!
        </div>
      )}
      {!summary && chunkGateNotice && hasChunk && (
        <div
          data-testid="learn-chunk-gate"
          className="rounded-2xl border border-quizlet-green/40 bg-quizlet-green/10 p-4 flex flex-wrap items-center gap-3"
        >
          <div className="text-sm font-extrabold text-quizlet-green flex-1 min-w-[200px]">
            Cụm {activeChunk} đã đạt (Familiar + M ≥ 70). Bạn có thể sang cụm tiếp theo!
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRestartSameChunk}>
              Ôn lại cụm này
            </Button>
            {canGoNextChunk ? (
              <Button variant="primary" data-testid="learn-next-chunk-btn" onClick={handleNextChunk}>
                Sang cụm {activeChunk + 1}/{totalChunks}
              </Button>
            ) : null}
          </div>
        </div>
      )}

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
                selectedAnswer={feedback ? submittedDisplay : null}
                correctAnswer={feedback ? feedback.correct_answer : null}
                onSelectOption={(_idx, optText) => handleAnswer(optText, optText)}
              />
            )}

            {question.question_type === "true_false" && (
              <TrueFalseQuestion
                prompt={question.prompt}
                proposedDefinition={question.proposed_definition || ""}
                disabled={Boolean(feedback) || isSubmitting}
                selectedChoice={
                  feedback ? submittedDisplay === "True" : null
                }
                correctChoice={
                  feedback
                    ? (question.is_true ??
                      (question.proposed_definition === feedback.correct_answer))
                    : null
                }
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
                hideAnswerComparison={
                  question.question_type === "mcq" ||
                  question.question_type === "true_false" ||
                  question.question_type === "recall"
                }
              />
            )}
          </div>
        )
      )}
      </div>
    </AuthGuard>
  );
}

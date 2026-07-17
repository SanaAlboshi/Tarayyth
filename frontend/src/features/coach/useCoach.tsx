import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { AnalysisInput, AnalysisResult } from "../../types";
import { useAnalysis, AnalysisSnapshot } from "../analysis/analysisStore";
import { useNotifications } from "../notifications/notificationsStore";

export type CoachStatus = "ahead" | "on_track" | "behind";

export interface CoachTip {
  title: string;
  body: string;
  tone: "ok" | "warn" | "info" | "danger";
}

export interface CoachResult {
  goal: string;
  goalPrice: number;
  targetMonths: number;
  monthsElapsed: number;
  monthsRemaining: number;
  currentSavings: number;
  requiredMonthlySavings: number;
  actualMonthlySavings: number;
  progressPercent: number;
  expectedProgressPercent: number;
  driftMonths: number;
  status: CoachStatus;
  estimatedCompletionDate: string;
  headline: string;
  tips: CoachTip[];
}

interface CoachPayload {
  input: AnalysisInput;
  result: AnalysisResult;
  history: {
    createdAt: string;
    monthlySavings: number;
    savings: number;
  }[];
  startedAt?: string;
}

function buildPayload(
  input: AnalysisInput,
  result: AnalysisResult,
  history: AnalysisSnapshot[]
): CoachPayload {
  return {
    input,
    result,
    history: history.map((h) => ({
      createdAt: h.createdAt,
      monthlySavings: h.result.monthlySavings,
      savings: h.input.savings,
    })),
    startedAt: history[0]?.createdAt,
  };
}

export function useCoach() {
  const { input, result, history, hasAnalysis } = useAnalysis();
  const { push } = useNotifications();
  const [coach, setCoach] = useState<CoachResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef<string | null>(null);
  const lastStatus = useRef<CoachStatus | null>(null);

  useEffect(() => {
    if (!hasAnalysis || !input || !result) {
      setCoach(null);
      return;
    }

    // Cache key: recompute when latest snapshot changes (goal, price, savings, months, expenses).
    const key = JSON.stringify({
      g: input.goal,
      p: input.goalPrice,
      s: input.savings,
      m: input.targetMonths,
      e: input.expenses,
      r: input.restaurants,
      t: input.entertainment,
      d: input.debts,
      h: history.length,
    });
    if (lastKey.current === key) return;
    lastKey.current = key;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .post<CoachResult>("/coach", buildPayload(input, result, history))
      .then(({ data }) => {
        if (cancelled) return;
        setCoach(data);

        // "Continuous monitoring" — push a notification when status changes.
        if (lastStatus.current && lastStatus.current !== data.status) {
          push({
            title:
              data.status === "behind"
                ? "المدرّب المالي: أنت متأخر عن خطة الادخار"
                : data.status === "ahead"
                ? "المدرّب المالي: تقدم رائع على خطتك"
                : "المدرّب المالي: عدت إلى المسار الصحيح",
            body: data.headline,
            severity:
              data.status === "behind" ? "warn" : data.status === "ahead" ? "ok" : "info",
          });
        }
        lastStatus.current = data.status;
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "تعذّر تحديث المدرّب المالي.");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnalysis, input, result, history.length]);

  return { coach, loading, error };
}

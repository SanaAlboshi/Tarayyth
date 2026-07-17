import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnalysisInput, AnalysisResult } from "../../types";
import { useAuth } from "../auth/authStore";

export interface AnalysisSnapshot {
  input: AnalysisInput;
  result: AnalysisResult;
  createdAt: string;
}

interface Ctx {
  input: AnalysisInput | null;
  result: AnalysisResult | null;
  history: AnalysisSnapshot[];
  hasAnalysis: boolean;
  setAnalysis: (input: AnalysisInput, result: AnalysisResult) => void;
  clear: () => void;
}

const AnalysisContext = createContext<Ctx | null>(null);
const STORAGE_PREFIX = "trayyath.analysis::";

const keyFor = (email: string | null | undefined) =>
  email ? `${STORAGE_PREFIX}${email.toLowerCase()}` : null;

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = keyFor(user?.email);

  const [history, setHistory] = useState<AnalysisSnapshot[]>([]);

  useEffect(() => {
    if (!storageKey) {
      setHistory([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      setHistory(raw ? (JSON.parse(raw) as AnalysisSnapshot[]) : []);
    } catch {
      setHistory([]);
    }
  }, [storageKey]);

  const latest = history[history.length - 1] ?? null;

  const setAnalysis = useCallback(
    (i: AnalysisInput, r: AnalysisResult) => {
      if (!storageKey) return;
      const snapshot: AnalysisSnapshot = {
        input: i,
        result: r,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => {
        const next = [...prev, snapshot];
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey]
  );

  const clear = useCallback(() => {
    if (!storageKey) return;
    setHistory([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const value = useMemo(
    () => ({
      input: latest?.input ?? null,
      result: latest?.result ?? null,
      history,
      hasAnalysis: !!latest,
      setAnalysis,
      clear,
    }),
    [latest, history, setAnalysis, clear]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("AnalysisProvider missing");
  return ctx;
}

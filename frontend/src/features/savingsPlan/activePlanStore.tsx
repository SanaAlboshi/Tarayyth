import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/authStore";
import { AnalysisInput } from "../../types";

export type PlanMode = "ai" | "custom";

export interface ActivePlan {
  mode: PlanMode;
  customMonths: number;
}

interface Ctx {
  plan: ActivePlan;
  setMode: (mode: PlanMode) => void;
  setCustomMonths: (months: number) => void;
  activate: (mode: PlanMode, customMonths?: number) => void;
}

const ActivePlanContext = createContext<Ctx | null>(null);
const STORAGE_PREFIX = "trayyath.active-plan::";

const DEFAULT: ActivePlan = { mode: "ai", customMonths: 12 };

const keyFor = (email: string | null | undefined) =>
  email ? `${STORAGE_PREFIX}${email.toLowerCase()}` : null;

export function ActivePlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = keyFor(user?.email);
  const [plan, setPlan] = useState<ActivePlan>(DEFAULT);

  useEffect(() => {
    if (!storageKey) {
      setPlan(DEFAULT);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ActivePlan>;
        setPlan({
          mode: parsed.mode === "custom" ? "custom" : "ai",
          customMonths:
            typeof parsed.customMonths === "number" && parsed.customMonths > 0
              ? Math.round(parsed.customMonths)
              : DEFAULT.customMonths,
        });
      } else {
        setPlan(DEFAULT);
      }
    } catch {
      setPlan(DEFAULT);
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: ActivePlan) => {
      setPlan(next);
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey]
  );

  const setMode = useCallback(
    (mode: PlanMode) => persist({ ...plan, mode }),
    [plan, persist]
  );

  const setCustomMonths = useCallback(
    (months: number) => {
      const safe = Math.max(1, Math.min(120, Math.round(months) || 1));
      persist({ ...plan, customMonths: safe });
    },
    [plan, persist]
  );

  const activate = useCallback(
    (mode: PlanMode, customMonths?: number) =>
      persist({
        mode,
        customMonths:
          typeof customMonths === "number" && customMonths > 0
            ? Math.max(1, Math.min(120, Math.round(customMonths)))
            : plan.customMonths,
      }),
    [plan.customMonths, persist]
  );

  const value = useMemo<Ctx>(
    () => ({ plan, setMode, setCustomMonths, activate }),
    [plan, setMode, setCustomMonths, activate]
  );

  return <ActivePlanContext.Provider value={value}>{children}</ActivePlanContext.Provider>;
}

export function useActivePlan() {
  const ctx = useContext(ActivePlanContext);
  if (!ctx) throw new Error("ActivePlanProvider missing");
  return ctx;
}

/**
 * Apply the active plan to an AnalysisInput before sending to backend.
 * If Custom is active, override targetMonths with the user-chosen duration.
 * If AI is active, the input is returned as-is (backend picks the realistic plan).
 */
export function applyActivePlan(input: AnalysisInput, active: ActivePlan): AnalysisInput {
  if (active.mode === "custom") {
    return { ...input, targetMonths: active.customMonths };
  }
  return input;
}

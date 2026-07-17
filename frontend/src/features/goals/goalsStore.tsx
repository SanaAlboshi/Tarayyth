import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/authStore";
import { useAnalysis } from "../analysis/analysisStore";

export type GoalPriority = "high" | "medium" | "low";

export type GoalCategory =
  | "wedding"
  | "home"
  | "car"
  | "travel"
  | "education"
  | "business"
  | "other";

export interface Goal {
  id: string;
  name: string;
  targetPrice: number;
  priority: GoalPriority;
  category?: GoalCategory;
  targetDate?: string; // ISO
  notes?: string;
  allocated: number;
  monthlyAllocation?: number;
  completed: boolean;
  createdAt: string;
}

export interface GoalTotals {
  totalSavings: number;
  totalAllocated: number;
  unallocated: number;
  monthlyCapacity: number;
  totalMonthlyAllocated: number;
  monthlyUnallocated: number;
}

interface Ctx {
  goals: Goal[];
  activeGoals: Goal[]; // non-completed
  activeGoalId: string | null;
  activeGoal: Goal | null;
  totals: GoalTotals;
  selectGoal: (id: string) => void;
  addGoal: (input: {
    name: string;
    targetPrice: number;
    priority: GoalPriority;
    category?: GoalCategory;
    targetDate?: string;
    notes?: string;
    allocated?: number;
    monthlyAllocation?: number;
  }) => Goal;
  editGoal: (id: string, patch: Partial<Omit<Goal, "id" | "createdAt">>) => void;
  editAllocation: (id: string, amount: number) => void;
  editMonthlyAllocation: (id: string, amount: number) => void;
  editPriority: (id: string, priority: GoalPriority) => void;
  editTargetDate: (id: string, date: string | undefined) => void;
  deleteGoal: (id: string) => void;
  setCompleted: (id: string, completed: boolean) => void;
  applyMonthlyDistribution: (
    distributions: { goalId: string; amount: number }[]
  ) => void;
}

const GoalsContext = createContext<Ctx | null>(null);

const STORAGE_PREFIX = "trayyath.goals::";
const ACTIVE_PREFIX = "trayyath.active-goal::";

const keyFor = (email: string | null | undefined) =>
  email ? `${STORAGE_PREFIX}${email.toLowerCase()}` : null;

const activeKeyFor = (email: string | null | undefined) =>
  email ? `${ACTIVE_PREFIX}${email.toLowerCase()}` : null;

const uid = () => `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { input, result } = useAnalysis();

  const storageKey = keyFor(user?.email);
  const activeKey = activeKeyFor(user?.email);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);

  // Load from storage on user change
  useEffect(() => {
    if (!storageKey) {
      setGoals([]);
      setActiveGoalId(null);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      const loaded: Goal[] = raw ? JSON.parse(raw) : [];
      // Backfill `completed` for older records
      setGoals(loaded.map((g) => ({ ...g, completed: g.completed ?? false })));
    } catch {
      setGoals([]);
    }
    try {
      const savedActive = activeKey ? localStorage.getItem(activeKey) : null;
      setActiveGoalId(savedActive || null);
    } catch {
      setActiveGoalId(null);
    }
  }, [storageKey, activeKey]);

  // Seed the first goal from the existing analysis input so nothing changes
  // for legacy single-goal users. Only runs when the list is empty.
  useEffect(() => {
    if (!storageKey) return;
    if (goals.length > 0) return;
    if (!input || !input.goal || input.goalPrice <= 0) return;
    const seed: Goal = {
      id: uid(),
      name: input.goal,
      targetPrice: input.goalPrice,
      priority: "high",
      allocated: Math.max(0, Math.min(input.savings, input.goalPrice)),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setGoals([seed]);
    setActiveGoalId(seed.id);
    localStorage.setItem(storageKey, JSON.stringify([seed]));
    if (activeKey) localStorage.setItem(activeKey, seed.id);
  }, [storageKey, activeKey, goals.length, input]);

  // Persist goals
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(goals));
  }, [storageKey, goals]);

  // Persist active
  useEffect(() => {
    if (!activeKey) return;
    if (activeGoalId) localStorage.setItem(activeKey, activeGoalId);
  }, [activeKey, activeGoalId]);

  // Guard: if active goal disappears (goals refreshed), fall back to the first one.
  useEffect(() => {
    if (goals.length === 0) return;
    if (activeGoalId && goals.find((g) => g.id === activeGoalId)) return;
    setActiveGoalId(goals[0].id);
  }, [goals, activeGoalId]);

  const selectGoal = useCallback((id: string) => setActiveGoalId(id), []);

  const addGoal = useCallback<Ctx["addGoal"]>(
    ({ name, targetPrice, priority, category, targetDate, notes, allocated, monthlyAllocation }) => {
      const g: Goal = {
        id: uid(),
        name: name.trim(),
        targetPrice: Math.max(0, Math.round(targetPrice) || 0),
        priority,
        category,
        targetDate: targetDate || undefined,
        notes,
        allocated: Math.max(0, Math.round(allocated || 0)),
        monthlyAllocation:
          typeof monthlyAllocation === "number" && monthlyAllocation > 0
            ? Math.round(monthlyAllocation)
            : undefined,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setGoals((prev) => [...prev, g]);
      setActiveGoalId(g.id);
      return g;
    },
    []
  );

  const editGoal = useCallback<Ctx["editGoal"]>((id, patch) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              ...patch,
              // guard numeric bounds
              targetPrice:
                typeof patch.targetPrice === "number"
                  ? Math.max(0, Math.round(patch.targetPrice))
                  : g.targetPrice,
              allocated:
                typeof patch.allocated === "number"
                  ? Math.max(0, Math.round(patch.allocated))
                  : g.allocated,
              monthlyAllocation:
                typeof patch.monthlyAllocation === "number"
                  ? patch.monthlyAllocation > 0
                    ? Math.round(patch.monthlyAllocation)
                    : undefined
                  : g.monthlyAllocation,
            }
          : g
      )
    );
  }, []);

  const editAllocation = useCallback<Ctx["editAllocation"]>((id, amount) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, allocated: Math.max(0, Math.round(amount) || 0) } : g
      )
    );
  }, []);

  const editMonthlyAllocation = useCallback<Ctx["editMonthlyAllocation"]>(
    (id, amount) => {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                monthlyAllocation:
                  amount > 0 ? Math.round(amount) : undefined,
              }
            : g
        )
      );
    },
    []
  );

  const editPriority = useCallback<Ctx["editPriority"]>((id, priority) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, priority } : g)));
  }, []);

  const editTargetDate = useCallback<Ctx["editTargetDate"]>((id, date) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, targetDate: date || undefined } : g))
    );
  }, []);

  const deleteGoal = useCallback<Ctx["deleteGoal"]>((id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const setCompleted = useCallback<Ctx["setCompleted"]>((id, completed) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              completed,
              monthlyAllocation: completed ? 0 : g.monthlyAllocation,
            }
          : g
      )
    );
  }, []);

  const applyMonthlyDistribution = useCallback<Ctx["applyMonthlyDistribution"]>(
    (distributions) => {
      setGoals((prev) =>
        prev.map((g) => {
          const d = distributions.find((x) => x.goalId === g.id);
          if (!d || d.amount <= 0) return g;
          const nextAllocated = Math.min(
            g.targetPrice,
            g.allocated + Math.max(0, Math.round(d.amount))
          );
          return { ...g, allocated: nextAllocated };
        })
      );
    },
    []
  );

  // ------- Derived totals -------
  const activeGoals = useMemo(() => goals.filter((g) => !g.completed), [goals]);

  const totals = useMemo<GoalTotals>(() => {
    const totalSavings = input?.savings ?? 0;
    const totalAllocated = goals.reduce((s, g) => s + Math.max(0, g.allocated), 0);
    const unallocated = Math.max(0, totalSavings - totalAllocated);
    const monthlyCapacity = Math.max(0, result?.monthlySavings ?? 0);
    const totalMonthlyAllocated = goals.reduce(
      (s, g) => s + Math.max(0, g.monthlyAllocation ?? 0),
      0
    );
    const monthlyUnallocated = Math.max(0, monthlyCapacity - totalMonthlyAllocated);
    return {
      totalSavings,
      totalAllocated,
      unallocated,
      monthlyCapacity,
      totalMonthlyAllocated,
      monthlyUnallocated,
    };
  }, [goals, input?.savings, result?.monthlySavings]);

  const activeGoal = useMemo(
    () => goals.find((g) => g.id === activeGoalId) ?? null,
    [goals, activeGoalId]
  );

  const value = useMemo<Ctx>(
    () => ({
      goals,
      activeGoals,
      activeGoalId,
      activeGoal,
      totals,
      selectGoal,
      addGoal,
      editGoal,
      editAllocation,
      editMonthlyAllocation,
      editPriority,
      editTargetDate,
      deleteGoal,
      setCompleted,
      applyMonthlyDistribution,
    }),
    [
      goals,
      activeGoals,
      activeGoalId,
      activeGoal,
      totals,
      selectGoal,
      addGoal,
      editGoal,
      editAllocation,
      editMonthlyAllocation,
      editPriority,
      editTargetDate,
      deleteGoal,
      setCompleted,
      applyMonthlyDistribution,
    ]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error("GoalsProvider missing");
  return ctx;
}

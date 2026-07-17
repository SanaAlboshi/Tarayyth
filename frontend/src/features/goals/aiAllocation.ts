import { Goal, GoalPriority } from "./goalsStore";
import { formatSAR } from "../../lib/format";

const PRIORITY_WEIGHT: Record<GoalPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

export interface AllocationResult {
  perGoal: Record<string, number>; // goalId -> amount
  reason: string;
  topGoalId?: string;
}

/**
 * Distribute `pool` across `goals` weighted by priority × urgency and capped
 * by each goal's remaining need. Completed goals get 0.
 *
 * mode = "current" clamps by remaining need (goal.targetPrice - goal.allocated)
 * mode = "monthly" does not clamp by remaining (the pool is the monthly amount)
 */
export function distributeAI(
  pool: number,
  goals: Goal[],
  mode: "current" | "monthly"
): AllocationResult {
  const perGoal: Record<string, number> = {};
  goals.forEach((g) => (perGoal[g.id] = 0));

  const active = goals.filter((g) => !g.completed);
  if (active.length === 0 || pool <= 0) {
    return { perGoal, reason: buildReason([], []) };
  }

  const now = Date.now();

  // Compute weights.
  const weights = active.map((g) => {
    const priority = PRIORITY_WEIGHT[g.priority] ?? 2;
    // Urgency: shorter months-to-target = higher urgency. If no date, neutral.
    const monthsAway = g.targetDate
      ? Math.max(1, (new Date(g.targetDate).getTime() - now) / MS_PER_MONTH)
      : 12;
    const urgency = 1 / Math.min(48, Math.max(1, monthsAway));
    const remaining = Math.max(0, g.targetPrice - g.allocated);
    const need =
      mode === "current" ? Math.max(0, remaining) : Math.max(1, remaining);
    const w = priority * (urgency * 12) * (need > 0 ? 1 : 0);
    return { id: g.id, goal: g, need, weight: Math.max(0, w) };
  });

  const totalWeight = weights.reduce((s, x) => s + x.weight, 0);
  if (totalWeight <= 0) {
    return { perGoal, reason: buildReason([], []) };
  }

  let remainingPool = pool;
  // Sort so we allocate to biggest weights first (helps rounding).
  const sortedByWeight = [...weights].sort((a, b) => b.weight - a.weight);

  // First pass: proportional share, capped by need (in "current" mode).
  const share = sortedByWeight.map((w) => {
    let amount = Math.round((w.weight / totalWeight) * pool);
    if (mode === "current" && amount > w.need) amount = w.need;
    return { ...w, amount };
  });

  // Reduce pool.
  const spent = share.reduce((s, x) => s + x.amount, 0);
  remainingPool = pool - spent;

  // Second pass: hand out leftovers to highest-weight goal that still has need.
  if (mode === "current" && remainingPool > 0) {
    for (const s of share) {
      const roomInGoal = Math.max(0, s.need - s.amount);
      if (roomInGoal <= 0) continue;
      const bump = Math.min(roomInGoal, remainingPool);
      s.amount += bump;
      remainingPool -= bump;
      if (remainingPool <= 0) break;
    }
  } else if (mode === "monthly" && remainingPool !== 0) {
    // Add/subtract the delta to the top-weight goal to make totals match exactly.
    share[0].amount = Math.max(0, share[0].amount + remainingPool);
  }

  share.forEach((s) => (perGoal[s.id] = s.amount));

  const topGoalId = share[0]?.id;
  return {
    perGoal,
    topGoalId,
    reason: buildReason(share.map((x) => x.goal), share.map((x) => x.amount)),
  };
}

function buildReason(goals: Goal[], amounts: number[]): string {
  if (goals.length === 0) return "لا توجد أهداف نشطة حالياً للتوزيع عليها.";
  if (goals.length === 1) {
    return `تم توجيه ${formatSAR(amounts[0])} إلى "${goals[0].name}" لأنه الهدف النشط الوحيد.`;
  }
  const top = goals[0];
  const second = goals[1];
  const priorityAr: Record<GoalPriority, string> = {
    high: "أولوية عالية",
    medium: "أولوية متوسطة",
    low: "أولوية منخفضة",
  };
  const parts = [
    `تم إعطاء "${top.name}" النصيب الأكبر (${formatSAR(amounts[0])}) لأنه ذو ${
      priorityAr[top.priority]
    }${top.targetDate ? " وموعده الأقرب" : ""}.`,
  ];
  if (second) {
    parts.push(
      `يستمر ادخار "${second.name}" بمعدل ${formatSAR(amounts[1])} على التوازي.`
    );
  }
  return parts.join(" ");
}

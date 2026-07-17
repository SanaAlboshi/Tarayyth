import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Wallet,
  CalendarClock,
  CalendarCheck,
  Coins,
  Flag,
  Plus,
  Pencil,
  Lightbulb,
  Save,
  X,
  MoreVertical,
  ChevronDown,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight,
  ChevronLeft,
  Trash2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Bank palette (goals-section only)                                   */
/* ------------------------------------------------------------------ */

const BANK = {
  ink: "#02151e",        // deep primary ink (headings & values)
  inkAlt: "#002134",     // deep navy accent
  muted: "#3f3c3e",      // secondary text
  paper: "#fcf8f5",      // report paper background
  paperEdge: "#EDE7DE",  // subtle divider on paper
  warn: "#d58d79",       // attention state
  ai: "#837fd8",         // AI accent (subtle)
} as const;

// Soft tinted palettes used inside the three highlighted info blocks per goal.
// The block backgrounds stay calm; only the value uses a slightly bolder tone.
type BlockTint = { bg: string; value: string };
type CategoryTint = { remaining: BlockTint; monthly: BlockTint; date: BlockTint; accent: string };

function categoryTint(category?: string): CategoryTint {
  switch (category) {
    case "home":
      // Light blue / mint — dark navy value
      return {
        remaining: { bg: "#EAF1F6", value: BANK.inkAlt },
        monthly:   { bg: "#E4F1EC", value: "#0A5A42" },
        date:      { bg: "#EAF1F6", value: BANK.inkAlt },
        accent:    BANK.inkAlt,
      };
    case "wedding":
      // Soft peach — warm coral value
      return {
        remaining: { bg: "#FBEDE5", value: "#8A4A2F" },
        monthly:   { bg: "#F6E1D3", value: "#8A4A2F" },
        date:      { bg: "#FBEDE5", value: "#8A4A2F" },
        accent:    BANK.warn,
      };
    case "travel":
      // Soft lavender — purple value
      return {
        remaining: { bg: "#EDECF9", value: "#4C4A9C" },
        monthly:   { bg: "#EDECF9", value: "#4C4A9C" },
        date:      { bg: "#E4E2F5", value: "#4C4A9C" },
        accent:    BANK.ai,
      };
    case "car":
      return {
        remaining: { bg: "#EAF1F6", value: BANK.inkAlt },
        monthly:   { bg: "#EDECF9", value: "#4C4A9C" },
        date:      { bg: "#EAF1F6", value: BANK.inkAlt },
        accent:    BANK.inkAlt,
      };
    case "education":
      return {
        remaining: { bg: "#E4F1EC", value: "#0A5A42" },
        monthly:   { bg: "#EAF1F6", value: BANK.inkAlt },
        date:      { bg: "#E4F1EC", value: "#0A5A42" },
        accent:    "#0A5A42",
      };
    case "business":
      return {
        remaining: { bg: "#F3EBE0", value: "#7A5A22" },
        monthly:   { bg: "#EDECF9", value: "#4C4A9C" },
        date:      { bg: "#F3EBE0", value: "#7A5A22" },
        accent:    "#7A5A22",
      };
    default:
      return {
        remaining: { bg: "#EFEBE4", value: BANK.ink },
        monthly:   { bg: "#EFEBE4", value: BANK.ink },
        date:      { bg: "#EFEBE4", value: BANK.ink },
        accent:    BANK.muted,
      };
  }
}

function categoryIcon(category?: string): string {
  switch (category) {
    case "home": return "🏠";
    case "wedding": return "💍";
    case "car": return "🚗";
    case "travel": return "✈️";
    case "education": return "🎓";
    case "business": return "🚀";
    default: return "🎯";
  }
}
import { Button } from "../../components/shared/Button";
import { Input } from "../../components/shared/Input";
import { Modal } from "../../components/shared/Modal";
import { cn, formatSAR, formatDate } from "../../lib/format";
import { useGoals, Goal, GoalPriority } from "../goals/goalsStore";
import { useAnalysis } from "../analysis/analysisStore";
import { useCheckin } from "../checkin/checkinStore";
import { useNotifications } from "../notifications/notificationsStore";
import { AddGoalModal } from "../goals/AddGoalModal";
import { WalletCard } from "../wallet/WalletCard";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

function daysWord(n: number): string {
  if (n <= 0) return "";
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومين";
  if (n >= 3 && n <= 10) return `${n} أيام`;
  return `${n} يوماً`;
}

function monthsWord(n: number): string {
  if (n <= 0) return "";
  if (n === 1) return "شهر واحد";
  if (n === 2) return "شهرين";
  if (n >= 3 && n <= 10) return `${n} أشهر`;
  return `${n} شهراً`;
}

function futureDateLabel(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + Math.max(0, Math.round(monthsFromNow)));
  return `${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const PRIORITY_META: Record<
  GoalPriority,
  { label: string; badge: string; rank: number }
> = {
  high: {
    label: "أولوية عالية",
    badge: "bg-danger-light text-danger-dark",
    rank: 0,
  },
  medium: {
    label: "أولوية متوسطة",
    badge: "bg-warn-light text-warn-dark",
    rank: 1,
  },
  low: {
    label: "أولوية منخفضة",
    badge: "bg-primary-light text-primary-dark",
    rank: 2,
  },
};

function progressTone(pct: number, monthly: number): { stroke: string; bar: string } {
  if (pct >= 100) return { stroke: "stroke-ok", bar: "bg-ok" };
  if (monthly <= 0) return { stroke: "stroke-danger", bar: "bg-danger" };
  if (pct >= 50) return { stroke: "stroke-ok", bar: "bg-ok" };
  if (pct >= 20) return { stroke: "stroke-accent", bar: "bg-accent" };
  return { stroke: "stroke-ok", bar: "bg-ok" };
}

function sortGoals(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pa = PRIORITY_META[a.priority].rank;
    const pb = PRIORITY_META[b.priority].rank;
    if (pa !== pb) return pa - pb;
    const da = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
    const db = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
    if (da !== db) return da - db;
    const ra = Math.max(0, a.targetPrice - a.allocated);
    const rb = Math.max(0, b.targetPrice - b.allocated);
    return ra - rb;
  });
}

/* ------------------------------------------------------------------ */
/* Premium 3D AI Robot mascot — bank identity                          */
/* ------------------------------------------------------------------ */

function AIMascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 220"
      className={cn("animate-floaty", className)}
      aria-hidden="true"
    >
      <defs>
        {/* Head/body 3D navy gradient */}
        <linearGradient id="ai-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#E7E9EE" />
          <stop offset="100%" stopColor="#C9CFDA" />
        </linearGradient>
        {/* Face plate glossy dark */}
        <linearGradient id="ai-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A2444" />
          <stop offset="100%" stopColor="#02151e" />
        </linearGradient>
        {/* Eye glow */}
        <radialGradient id="ai-eye" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="#E7E5F8" />
          <stop offset="70%" stopColor="#837fd8" />
          <stop offset="100%" stopColor="#4C4A9C" />
        </radialGradient>
        {/* Chest badge shine */}
        <linearGradient id="ai-badge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F1EFFB" />
          <stop offset="100%" stopColor="#C7C2F0" />
        </linearGradient>
        {/* Soft shadow */}
        <radialGradient id="ai-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="100" cy="205" rx="55" ry="8" fill="url(#ai-shadow)" />

      {/* Antenna */}
      <line x1="100" y1="18" x2="100" y2="6" stroke="#002134" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="100" cy="5" r="4" fill="#d58d79" />
      <circle cx="100" cy="5" r="2" fill="#FFFFFF" opacity="0.6" />

      {/* Head */}
      <rect
        x="42"
        y="20"
        width="116"
        height="82"
        rx="26"
        fill="url(#ai-body)"
        stroke="#B9BFCC"
        strokeWidth="1"
      />
      {/* Head highlight */}
      <rect x="55" y="26" width="45" height="10" rx="5" fill="#FFFFFF" opacity="0.55" />

      {/* Face plate */}
      <rect x="54" y="34" width="92" height="52" rx="20" fill="url(#ai-face)" />
      <rect x="54" y="34" width="92" height="14" rx="14" fill="#FFFFFF" opacity="0.05" />

      {/* Cheeks (coral) */}
      <circle cx="60" cy="76" r="4" fill="#d58d79" opacity="0.6" />
      <circle cx="140" cy="76" r="4" fill="#d58d79" opacity="0.6" />

      {/* Eyes */}
      <circle cx="80" cy="60" r="9" fill="url(#ai-eye)" />
      <circle cx="120" cy="60" r="9" fill="url(#ai-eye)" />
      <circle cx="83" cy="57" r="2.5" fill="#FFFFFF" opacity="0.85" />
      <circle cx="123" cy="57" r="2.5" fill="#FFFFFF" opacity="0.85" />

      {/* Smile */}
      <path
        d="M86 78 Q100 86 114 78"
        stroke="#E7E5F8"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Neck */}
      <rect x="88" y="102" width="24" height="8" rx="3" fill="#B9BFCC" />

      {/* Body */}
      <rect
        x="34"
        y="110"
        width="132"
        height="80"
        rx="22"
        fill="url(#ai-body)"
        stroke="#B9BFCC"
        strokeWidth="1"
      />
      {/* Body highlight */}
      <rect x="46" y="116" width="45" height="10" rx="5" fill="#FFFFFF" opacity="0.5" />

      {/* Chest badge — purple sparkle (AI accent) */}
      <circle cx="100" cy="150" r="18" fill="url(#ai-badge)" />
      <circle
        cx="100"
        cy="150"
        r="18"
        fill="none"
        stroke="#837fd8"
        strokeWidth="1.5"
        opacity="0.75"
      />
      <path
        d="M100 138 L103 148 L113 150 L103 152 L100 162 L97 152 L87 150 L97 148 Z"
        fill="#837fd8"
      />

      {/* Arms */}
      <rect
        x="14"
        y="118"
        width="18"
        height="42"
        rx="9"
        fill="url(#ai-body)"
        stroke="#B9BFCC"
        strokeWidth="1"
      />
      <rect
        x="168"
        y="118"
        width="18"
        height="42"
        rx="9"
        fill="url(#ai-body)"
        stroke="#B9BFCC"
        strokeWidth="1"
      />
      {/* Hands */}
      <circle cx="23" cy="163" r="9" fill="url(#ai-body)" stroke="#B9BFCC" strokeWidth="1" />
      <circle cx="177" cy="163" r="9" fill="url(#ai-body)" stroke="#B9BFCC" strokeWidth="1" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* AI Recommendation                                                   */
/* ------------------------------------------------------------------ */

export interface AIGoalPlan {
  goal: Goal;
  isComplete: boolean;
  monthly: number;                // 0 for completed goals
  months: number | null;          // null when monthly=0 & not complete
  completionLabel: string;        // "تم تحقيق الهدف" | date | "—"
  reason: string;                 // per-goal short reason
}

interface AIRecommendation {
  canRecommend: boolean;
  safeCapacity: number;
  totalMonthly: number;           // sum of monthly across all plans (only active contribute)
  overflow: boolean;              // total > capacity — should never happen from builder but validated
  plans: AIGoalPlan[];            // ALL goals (completed included, sorted)
  currentPriorityGoal: Goal | null;
  redirectedFromCompleted: boolean;
  reasons: string[];              // for "why" modal
  perGoalMonthly: Record<string, number>; // legacy: goalId -> monthly (still used by GoalRow)
}

function priorityWeight(p: GoalPriority): number {
  return p === "high" ? 3 : p === "medium" ? 2 : 1;
}

/**
 * Distribute `capacity` across goals by priority weight, respecting each
 * goal's `remaining` cap. Iterates until either the whole capacity is
 * assigned or every goal has hit its remaining cap. Guarantees:
 *   - sum(result) <= capacity
 *   - result[i] <= remaining[i]
 *   - higher-priority goals get proportionally more per round
 */
function distributeByPriority(
  incomplete: Goal[],
  capacity: number
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const g of incomplete) out[g.id] = 0;
  if (capacity <= 0 || incomplete.length === 0) return out;

  const remaining: Record<string, number> = {};
  for (const g of incomplete) {
    remaining[g.id] = Math.max(0, g.targetPrice - g.allocated);
  }

  let pool = capacity;
  // Cap total pool by total remaining — never suggest more than what fills every goal
  const totalRemaining = incomplete.reduce((s, g) => s + remaining[g.id], 0);
  if (totalRemaining < pool) pool = totalRemaining;

  // Iterative fill: each round distributes leftover by weight among goals
  // that still have room.
  const MAX_ROUNDS = 6;
  for (let round = 0; round < MAX_ROUNDS && pool > 0; round++) {
    const eligible = incomplete.filter((g) => remaining[g.id] - out[g.id] > 0);
    if (eligible.length === 0) break;
    const totalWeight = eligible.reduce(
      (s, g) => s + priorityWeight(g.priority),
      0
    );
    let assignedThisRound = 0;
    for (const g of eligible) {
      const share = (priorityWeight(g.priority) / totalWeight) * pool;
      const headroom = remaining[g.id] - out[g.id];
      const add = Math.min(share, headroom);
      out[g.id] += add;
      assignedThisRound += add;
    }
    pool -= assignedThisRound;
    if (assignedThisRound < 1) break; // rounding stalled — stop
  }

  // Round to whole SAR while enforcing sum <= capacity
  const rounded: Record<string, number> = {};
  let running = 0;
  for (const g of incomplete) {
    const rounded_i = Math.floor(out[g.id]);
    rounded[g.id] = Math.min(rounded_i, remaining[g.id]);
    running += rounded[g.id];
  }
  // Give any small leftover (from flooring) to the highest-priority eligible goal
  let leftover = Math.floor(capacity) - running;
  if (leftover > 0) {
    const eligible = [...incomplete]
      .filter((g) => remaining[g.id] - rounded[g.id] > 0)
      .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
    for (const g of eligible) {
      if (leftover <= 0) break;
      const headroom = remaining[g.id] - rounded[g.id];
      const add = Math.min(leftover, headroom);
      rounded[g.id] += add;
      leftover -= add;
    }
  }

  return rounded;
}

function buildRecommendation(
  activeGoals: Goal[],
  allGoals: Goal[],
  capacity: number
): AIRecommendation {
  const sortedAll = sortGoals(allGoals);
  const sortedActive = sortGoals(activeGoals);
  const top = sortedActive[0] ?? null;
  const hasCompleted = allGoals.some((g) => g.completed);

  const distribution = distributeByPriority(sortedActive, capacity);

  const plans: AIGoalPlan[] = sortedAll.map((g) => {
    const remaining = Math.max(0, g.targetPrice - g.allocated);
    const isComplete = g.completed || remaining === 0;
    const monthly = isComplete ? 0 : distribution[g.id] ?? 0;
    const months =
      isComplete ? null : monthly > 0 ? Math.ceil(remaining / monthly) : null;
    const completionLabel = isComplete
      ? "تم تحقيق الهدف"
      : months !== null
      ? futureDateLabel(months)
      : "—";

    let reason: string;
    if (isComplete) {
      reason = "تم تحويل تخصيصه إلى الأهداف النشطة.";
    } else if (monthly === 0) {
      reason = "لا يوجد فائض بعد تغطية باقي الأهداف.";
    } else if (g.priority === "high") {
      reason = "أولوية عالية — حصة أكبر من التوزيع الشهري.";
    } else if (g.priority === "medium") {
      reason = "أولوية متوسطة — حصة متوازنة ضمن قدرتك الشهرية.";
    } else {
      reason = "أولوية منخفضة — الفائض بعد تغطية الأهداف الأعلى أولوية.";
    }

    return {
      goal: g,
      isComplete,
      monthly,
      months,
      completionLabel,
      reason,
    };
  });

  const totalMonthly = plans.reduce((s, p) => s + p.monthly, 0);
  const overflow = capacity > 0 && totalMonthly > capacity;

  const reasons: string[] = [];
  if (top) reasons.push(`"${top.name}" هو الهدف الأعلى أولوية — يأخذ الحصة الأكبر.`);
  if (hasCompleted) reasons.push("الأهداف المكتملة لا تأخذ تخصيصاً، ويُوجَّه المبلغ للأهداف النشطة.");
  if (capacity > 0 && !overflow)
    reasons.push("مجموع التوزيع لا يتجاوز قدرتك الشهرية الآمنة على الادخار.");
  reasons.push("الحصص موزّعة حسب الأولوية والمبلغ المتبقي لكل هدف.");

  const perGoalMonthly: Record<string, number> = {};
  for (const p of plans) perGoalMonthly[p.goal.id] = p.monthly;

  return {
    canRecommend: capacity > 0 && !!top,
    safeCapacity: capacity,
    totalMonthly,
    overflow,
    plans,
    currentPriorityGoal: top,
    redirectedFromCompleted: hasCompleted,
    reasons: reasons.slice(0, 4),
    perGoalMonthly,
  };
}

interface AIRecommendationCardProps {
  rec: AIRecommendation;
  onAccept: () => void;
  onEdit: () => void;
  onWhy: () => void;
}

function AIRecommendationCard({ rec, onAccept, onEdit, onWhy }: AIRecommendationCardProps) {
  // Dark navy → deep purple gradient. White text throughout.
  const cardStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${BANK.inkAlt} 0%, #0A2444 55%, #2A2560 100%)`,
    color: "#F4F1EC",
  };

  if (!rec.canRecommend) {
    return (
      <section
        className="relative overflow-hidden rounded-[32px] p-6 shadow-elevated sm:p-10"
        style={cardStyle}
      >
        <svg
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 opacity-[0.06]"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          <circle cx="200" cy="200" r="180" stroke="#F4F1EC" strokeWidth="1" fill="none" />
          <circle cx="200" cy="200" r="140" stroke="#F4F1EC" strokeWidth="1" fill="none" />
          <circle cx="200" cy="200" r="100" stroke="#F4F1EC" strokeWidth="1" fill="none" />
        </svg>

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl"
              style={{
                backgroundColor: "rgba(131,127,216,0.18)",
                border: "1px solid rgba(131,127,216,0.35)",
              }}
            >
              <Sparkles className="h-8 w-8" style={{ color: "#E7E5F8" }} />
            </div>
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{ backgroundColor: "rgba(131,127,216,0.22)", color: "#E7E5F8" }}
              >
                <Sparkles className="h-3 w-3" />
                توصية ذكية
              </span>
              <h2
                className="mt-3 text-xl font-bold sm:text-2xl"
                style={{ color: "#FFFFFF" }}
              >
                حدّث بياناتك المالية
              </h2>
              <p className="mt-1 max-w-md text-sm" style={{ color: "rgba(244,241,236,0.75)" }}>
                نحتاج دخلك ومصاريفك لحساب قدرتك الآمنة على الادخار.
              </p>
            </div>
          </div>
          <Link to="/app/financial-analysis">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-card transition hover:opacity-90"
              style={{ backgroundColor: BANK.warn }}
            >
              تحديث البيانات
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>
    );
  }

  // ------- Executive stats (no per-goal duplication) -------
  const activeCount = rec.plans.filter((p) => !p.isComplete).length;
  const completedCount = rec.plans.filter((p) => p.isComplete).length;

  // Plan state: balanced / needs review / not applied yet
  const planState: { label: string; tone: "ok" | "warn" | "muted" } = (() => {
    if (rec.overflow) return { label: "تحتاج مراجعة", tone: "warn" };
    if (rec.totalMonthly <= 0 || activeCount === 0)
      return { label: "لم تُعتمد بعد", tone: "muted" };
    if (rec.totalMonthly > rec.safeCapacity * 0.98)
      return { label: "قريبة من الحد", tone: "warn" };
    return { label: "متوازنة", tone: "ok" };
  })();

  const planStateStyle =
    planState.tone === "ok"
      ? { color: "#DFF5EC", bg: "rgba(184,219,203,0.22)" }
      : planState.tone === "warn"
      ? { color: "#F6D5C6", bg: "rgba(213,141,121,0.25)" }
      : { color: "rgba(244,241,236,0.75)", bg: "rgba(244,241,236,0.10)" };

  // Short single-sentence recommendation — no goal names, no lists.
  const shortRecommendation = (() => {
    if (rec.overflow) {
      return "مجموع التوزيع الحالي يتجاوز قدرتك الآمنة — يوصي الذكاء بتخفيض حصص الأهداف الأقل أولوية لإعادة التوازن.";
    }
    if (activeCount === 0) {
      return "لا توجد أهداف نشطة حالياً — أضف هدفاً للبدء بخطة الادخار الذكية.";
    }
    if (rec.redirectedFromCompleted) {
      return "تم توجيه تخصيص الأهداف المكتملة إلى أهدافك النشطة للحفاظ على تقدم متوازن.";
    }
    if (planState.label === "متوازنة") {
      return "يوصي الذكاء بالاستمرار على التوزيع الحالي لأنه يوازن بين الأولوية والقدرة المالية.";
    }
    if (planState.label === "قريبة من الحد") {
      return "خطتك تقترب من الحد الأعلى لقدرتك الآمنة — احرص على ترك هامش شهري صغير للطوارئ.";
    }
    return "اعتمد التوزيع المقترح لتبدأ في تحقيق أهدافك ضمن قدرتك الآمنة على الادخار.";
  })();

  return (
    <section
      className="relative overflow-hidden rounded-[32px] p-6 shadow-elevated sm:p-10"
      style={cardStyle}
    >
      {/* Decorative soft circles (mockup style) */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: `${BANK.ai}22` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(213,141,121,0.18)" }}
        aria-hidden="true"
      />
      <svg
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <circle cx="400" cy="200" r="180" stroke="#F4F1EC" strokeWidth="1" fill="none" />
        <circle cx="400" cy="200" r="140" stroke="#F4F1EC" strokeWidth="1" fill="none" />
        <circle cx="400" cy="200" r="100" stroke="#F4F1EC" strokeWidth="1" fill="none" />
      </svg>

      {/* AI badge — top */}
      <div className="relative mb-4 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
          style={{ backgroundColor: "rgba(131,127,216,0.22)", color: "#E7E5F8" }}
        >
          <Sparkles className="h-3 w-3" />
          توصية الذكاء الاصطناعي
        </span>
        {rec.redirectedFromCompleted && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: "rgba(213,141,121,0.25)", color: "#F6D5C6" }}
          >
            <CheckCircle2 className="h-3 w-3" />
            تم توجيه تخصيص هدف مكتمل
          </span>
        )}
      </div>

      {/* Main grid: right(text) | center(robot) | left(stats) — RTL friendly */}
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_auto_1fr] lg:items-center lg:gap-6">
        {/* Right column — title + short recommendation + actions */}
        <div className="min-w-0">
          <h2
            className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
            style={{ color: "#FFFFFF" }}
          >
            خطة الادخار الذكية
          </h2>
          <p
            className="mt-3 max-w-md text-sm leading-relaxed sm:text-base"
            style={{ color: "rgba(244,241,236,0.75)" }}
          >
            {shortRecommendation}
          </p>

          {/* Plan state pill inline */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgba(244,241,236,0.55)" }}
            >
              الخطة الحالية
            </span>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: planStateStyle.bg, color: planStateStyle.color }}
            >
              {planState.label}
            </span>
          </div>

          {/* Overflow warning */}
          {rec.overflow && (
            <div
              className="mt-4 flex items-start gap-2 rounded-xl px-3 py-2 text-[11px]"
              style={{ backgroundColor: "rgba(213,141,121,0.22)", color: "#F6D5C6" }}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>
                مجموع التوزيع يتجاوز قدرتك الآمنة على الادخار — لا يمكن اعتماد هذه الخطة.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onAccept}
              disabled={rec.overflow || rec.totalMonthly <= 0}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: BANK.warn }}
            >
              <CheckCircle2 className="h-4 w-4" />
              اعتماد الخطة
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:bg-white/10"
              style={{
                border: "1px solid rgba(244,241,236,0.25)",
                color: "#F4F1EC",
              }}
            >
              <Pencil className="h-4 w-4" />
              تعديل الخطة
            </button>
            <button
              type="button"
              onClick={onWhy}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition hover:bg-white/10"
              style={{ color: "rgba(244,241,236,0.85)" }}
            >
              <HelpCircle className="h-4 w-4" />
              لماذا هذا الاقتراح؟
            </button>
          </div>
        </div>

        {/* Center — premium 3D robot mascot */}
        <div className="relative mx-auto flex items-center justify-center">
          {/* soft glow disc under the robot */}
          <div
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ backgroundColor: `${BANK.ai}33` }}
            aria-hidden="true"
          />
          <AIMascot className="relative h-48 w-44 sm:h-56 sm:w-52" />
        </div>

        {/* Left column — 4 executive stat rows */}
        <ul
          className="space-y-3 rounded-2xl p-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <HeroStatRow
            icon={<Coins className="h-4 w-4" />}
            label="القدرة الآمنة على الادخار"
            value={`${formatSAR(rec.safeCapacity)}`}
            suffix="/ شهر"
          />
          <HeroStatRow
            icon={<Flag className="h-4 w-4" />}
            label="الأهداف النشطة"
            value={`${activeCount}`}
          />
          <HeroStatRow
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="الأهداف المكتملة"
            value={`${completedCount}`}
          />
          <HeroStatRow
            icon={<Wallet className="h-4 w-4" />}
            label="إجمالي التوزيع الشهري"
            value={formatSAR(rec.totalMonthly)}
            tone={rec.overflow ? "warn" : "default"}
          />
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Hero stat row — icon + label + value stacked on dark hero            */
/* ------------------------------------------------------------------ */

interface HeroStatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  tone?: "default" | "warn";
}

function HeroStatRow({ icon, label, value, suffix, tone = "default" }: HeroStatRowProps) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "rgba(131,127,216,0.18)",
          color: "#E7E5F8",
          border: "1px solid rgba(131,127,216,0.35)",
        }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "rgba(244,241,236,0.6)" }}
        >
          {label}
        </p>
        <p
          className="mt-0.5 text-base font-bold tabular-nums sm:text-lg"
          style={{ color: tone === "warn" ? "#F6D5C6" : "#FFFFFF" }}
        >
          {value}
          {suffix && (
            <span
              className="mr-1 text-[10px] font-medium"
              style={{ color: "rgba(244,241,236,0.55)" }}
            >
              {" "}
              {suffix}
            </span>
          )}
        </p>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Executive stat — small paired label/value on dark hero               */
/* ------------------------------------------------------------------ */

interface ExecStatProps {
  label: string;
  value: string;
  valueBadge?: { color: string; bg: string };
  tone?: "warn";
}

function ExecStat({ label, value, valueBadge, tone }: ExecStatProps) {
  return (
    <div>
      <dt
        className="text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: "rgba(244,241,236,0.55)" }}
      >
        {label}
      </dt>
      {valueBadge ? (
        <dd className="mt-2">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
            style={{ backgroundColor: valueBadge.bg, color: valueBadge.color }}
          >
            {value}
          </span>
        </dd>
      ) : (
        <dd
          className="mt-1 text-lg font-bold tabular-nums sm:text-xl"
          style={{ color: tone === "warn" ? "#F6D5C6" : "#FFFFFF" }}
        >
          {value}
        </dd>
      )}
    </div>
  );
}

function WhyModal({
  open,
  onClose,
  reasons,
}: {
  open: boolean;
  onClose: () => void;
  reasons: string[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="لماذا هذا الاقتراح؟" size="sm">
      <ul className="space-y-2.5">
        {reasons.map((r, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-xl border border-outline bg-surface-alt p-3 text-xs leading-relaxed text-ink"
          >
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
              {i + 1}
            </span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          icon={<X className="h-3.5 w-3.5" />}
          onClick={onClose}
        >
          إغلاق
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Circular progress                                                   */
/* ------------------------------------------------------------------ */

function CircularProgress({
  value,
  strokeClass,
  size = 64,
}: {
  value: number;
  strokeClass: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="fill-none stroke-outline"
          strokeWidth={5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn("fill-none", strokeClass)}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <span className="absolute text-xs font-bold text-ink">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Summary card                                                        */
/* ------------------------------------------------------------------ */

interface SummaryCardProps {
  eyebrow: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  action?: React.ReactNode;
  valueTone?: string;
}

function SummaryCard({
  eyebrow,
  value,
  hint,
  icon,
  iconBg,
  iconColor,
  action,
  valueTone = "text-ink",
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-outline bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        {/* Right (in RTL, comes first in DOM = right side) — icon */}
        <span
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
            iconBg,
            iconColor
          )}
        >
          {icon}
        </span>
        {/* Left — text stack */}
        <div className="flex-1 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
            {eyebrow}
          </p>
          <p className={cn("mt-1 text-lg font-bold leading-tight sm:text-xl", valueTone)}>
            {value}
          </p>
          {hint && <p className="mt-1 text-[11px] text-ink-mute">{hint}</p>}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Monthly update summary card                                         */
/* ------------------------------------------------------------------ */

function MonthlyUpdateSummary() {
  const { monthlyStatus } = useCheckin();
  const { state, daysDisplay, completedMonthLabel, nextInDays, nextDueISO } = monthlyStatus;

  if (state === "completed") {
    return (
      <SummaryCard
        eyebrow="التحديث القادم"
        value={`تم تحديث شهر ${completedMonthLabel ?? ""}`}
        hint={nextInDays > 0 ? `التالي بعد ${daysWord(nextInDays)}` : "قريباً"}
        icon={<CalendarCheck className="h-5 w-5" />}
        iconBg="bg-ok-light"
        iconColor="text-ok-dark"
        valueTone="text-ok-dark"
      />
    );
  }

  if (state === "due") {
    return (
      <SummaryCard
        eyebrow="التحديث القادم"
        value="حان وقت التحديث"
        icon={<CalendarCheck className="h-5 w-5" />}
        iconBg="bg-ok-light"
        iconColor="text-ok-dark"
        valueTone="text-ok-dark"
        action={
          <Link to="/app/checkin">
            <Button size="sm" variant="gold">
              حدّث الآن
            </Button>
          </Link>
        }
      />
    );
  }

  if (state === "overdue") {
    return (
      <SummaryCard
        eyebrow="التحديث القادم"
        value={`متأخر منذ ${daysWord(daysDisplay)}`}
        icon={<CalendarClock className="h-5 w-5" />}
        iconBg="bg-warn-light"
        iconColor="text-warn-dark"
        valueTone="text-warn-dark"
        action={
          <Link to="/app/checkin">
            <Button size="sm" variant="primary">
              حدّث الآن
            </Button>
          </Link>
        }
      />
    );
  }

  // before — show "بعد N يوماً" + next date
  const dateLabel = nextDueISO ? formatDate(nextDueISO) : "";
  return (
    <SummaryCard
      eyebrow="التحديث القادم"
      value={`بعد ${daysWord(daysDisplay)}`}
      hint={dateLabel}
      icon={<CalendarClock className="h-5 w-5" />}
      iconBg="bg-ok-light"
      iconColor="text-ok-dark"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Goal row                                                            */
/* ------------------------------------------------------------------ */

interface GoalRowProps {
  goal: Goal;
  order: number;
  aiSuggestedMonthly?: number;
  onEdit: () => void;
  onDetails: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}

/* ------------------------------------------------------------------ */
/* Row action menu — portal overlay anchored to the three-dots button  */
/* ------------------------------------------------------------------ */

// Broadcast so only one row menu can be open at a time across the page.
let CURRENT_OPEN_MENU_ID: string | null = null;
const MENU_LISTENERS = new Set<(id: string | null) => void>();
function setCurrentMenu(id: string | null) {
  CURRENT_OPEN_MENU_ID = id;
  MENU_LISTENERS.forEach((fn) => fn(id));
}

interface GoalRowMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

function GoalRowMenu({ items }: { items: GoalRowMenuItem[] }) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    placement: "bottom" | "top";
    visibility: "hidden" | "visible";
  }>({ top: 0, left: 0, placement: "bottom", visibility: "hidden" });

  const MENU_WIDTH = 160;
  const MENU_MAX_HEIGHT = 220;
  const GAP = 6;

  const recompute = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;

    // Horizontal: in RTL we prefer opening toward the inside of the screen.
    // Default = align menu's right edge with the button's right edge.
    // If that overflows the left viewport edge, flip to left-align.
    let left = rect.right - MENU_WIDTH;
    if (left < margin) left = rect.left;
    if (left + MENU_WIDTH > vw - margin) left = vw - margin - MENU_WIDTH;
    if (left < margin) left = margin;

    // Vertical: prefer below, flip above if not enough space.
    let placement: "bottom" | "top" = "bottom";
    let top = rect.bottom + GAP;
    if (top + MENU_MAX_HEIGHT > vh - margin) {
      // Try above.
      const topAbove = rect.top - GAP - MENU_MAX_HEIGHT;
      if (topAbove >= margin) {
        placement = "top";
        top = rect.top - GAP;
      }
    }

    setPos({ top, left, placement, visibility: "visible" });
  };

  // Recompute + attach listeners while open.
  useLayoutEffect(() => {
    if (!open) return;
    recompute();
    const onScroll = () => recompute();
    const onResize = () => recompute();
    // Capture on scroll so nested scrollers also trigger repositioning.
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // Outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        triggerRef.current &&
        !triggerRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Only one menu open at a time — subscribe to the broadcast.
  useEffect(() => {
    const listener = (id: string | null) => {
      if (id !== menuId && open) setOpen(false);
    };
    MENU_LISTENERS.add(listener);
    return () => {
      MENU_LISTENERS.delete(listener);
    };
  }, [menuId, open]);

  // On unmount, clear the broadcast if this was the open one.
  useEffect(() => {
    return () => {
      if (CURRENT_OPEN_MENU_ID === menuId) setCurrentMenu(null);
    };
  }, [menuId]);

  const openMenu = () => {
    // Hide until first layout pass so we never flash at (0,0).
    setPos((p) => ({ ...p, visibility: "hidden" }));
    setOpen(true);
    setCurrentMenu(menuId);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
            setCurrentMenu(null);
          } else {
            openMenu();
          }
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-black/5"
        style={{ color: BANK.muted }}
        aria-label="خيارات"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                role="menu"
                initial={{
                  opacity: 0,
                  y: pos.placement === "bottom" ? -4 : 4,
                }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: pos.placement === "bottom" ? -4 : 4,
                }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  top:
                    pos.placement === "bottom"
                      ? pos.top
                      : pos.top - MENU_MAX_HEIGHT,
                  left: pos.left,
                  width: MENU_WIDTH,
                  maxHeight: MENU_MAX_HEIGHT,
                  zIndex: 9999,
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${BANK.paperEdge}`,
                  borderRadius: 12,
                  overflow: "hidden",
                  boxShadow:
                    "0 8px 16px rgba(15,42,46,0.06), 0 20px 40px rgba(15,42,46,0.10)",
                  visibility: pos.visibility,
                }}
              >
                {items.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      setCurrentMenu(null);
                      item.onSelect();
                    }}
                    className={
                      item.danger
                        ? "block w-full px-3 py-2 text-right text-xs text-danger hover:bg-danger-light"
                        : "block w-full px-3 py-2 text-right text-xs transition hover:bg-black/5"
                    }
                    style={item.danger ? undefined : { color: BANK.ink }}
                  >
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

function GoalRow({
  goal,
  order,
  aiSuggestedMonthly,
  onEdit,
  onDetails,
  onDelete,
  onToggleComplete,
}: GoalRowProps) {
  const remaining = Math.max(0, goal.targetPrice - goal.allocated);
  const acceptedMonthly = Math.max(0, goal.monthlyAllocation ?? 0);
  const isPendingAI = acceptedMonthly === 0 && (aiSuggestedMonthly ?? 0) > 0;
  const monthly = isPendingAI ? (aiSuggestedMonthly ?? 0) : acceptedMonthly;

  const pct =
    goal.targetPrice > 0
      ? Math.min(100, Math.round((goal.allocated / goal.targetPrice) * 100))
      : 0;
  const rawMonths = monthly > 0 ? Math.ceil(remaining / monthly) : null;
  const unrealistic = rawMonths !== null && rawMonths > 120; // > 10 years
  const priority = PRIORITY_META[goal.priority];

  const monthsLabel = rawMonths === null
    ? "لم تُحدد بعد"
    : unrealistic
    ? "المدة طويلة جداً بالخطة الحالية"
    : monthsWord(rawMonths);

  const completionLabel = rawMonths === null || unrealistic
    ? "—"
    : futureDateLabel(rawMonths);

  // AI suggestion note: pending-AI OR AI suggests more than accepted
  const aiSuggestsIncrease =
    !isPendingAI &&
    (aiSuggestedMonthly ?? 0) > acceptedMonthly + 100 &&
    acceptedMonthly > 0;

  const tint = categoryTint(goal.category);
  const barFillColor = unrealistic ? BANK.warn : tint.accent;

  return (
    <article
      className="group relative overflow-hidden rounded-2xl transition-shadow hover:shadow-elevated"
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BANK.paperEdge}`,
      }}
    >
      {/* Subtle vertical accent (side stripe) — uses category accent */}
      <span
        className="absolute right-0 top-0 h-full w-1"
        style={{ backgroundColor: tint.accent, opacity: 0.85 }}
        aria-hidden="true"
      />

      <div className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(140px,1.2fr)_minmax(160px,1.4fr)_auto] sm:items-center sm:gap-5 sm:p-5">
        {/* Icon + name + badges */}
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-lg leading-none"
            style={{ backgroundColor: tint.remaining.bg }}
            aria-hidden="true"
          >
            {categoryIcon(goal.category)}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[10px] tabular-nums"
                style={{ color: BANK.muted }}
              >
                #{String(order).padStart(2, "0")}
              </span>
              <h3
                className="truncate text-sm font-bold leading-tight sm:text-base"
                style={{ color: BANK.ink }}
              >
                {goal.name}
              </h3>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  priority.badge
                )}
              >
                {priority.label}
              </span>
              {isPendingAI && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: `${BANK.ai}22`, color: BANK.ai }}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  اقتراح الذكاء
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar + percentage + saved/target */}
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="text-lg font-bold tabular-nums tracking-tight sm:text-xl"
              style={{ color: BANK.ink }}
            >
              {pct}
              <span
                className="ml-0.5 text-xs font-semibold"
                style={{ color: BANK.muted }}
              >
                %
              </span>
            </span>
            <p className="truncate text-[10px]" style={{ color: BANK.muted }}>
              <span
                className="font-bold tabular-nums"
                style={{ color: BANK.ink }}
              >
                {formatSAR(goal.allocated)}
              </span>{" "}
              من <span className="tabular-nums">{formatSAR(goal.targetPrice)}</span>
            </p>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: BANK.paperEdge }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(2, pct)}%`, backgroundColor: barFillColor }}
            />
          </div>
        </div>

        {/* Inline stats: remaining, monthly, months, date */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] sm:grid-cols-4 sm:gap-x-3">
          <InlineStat
            label="المتبقي"
            value={formatSAR(remaining)}
            valueColor={BANK.ink}
          />
          <InlineStat
            label={isPendingAI ? "اقتراح شهري" : "شهري"}
            value={monthly > 0 ? formatSAR(monthly) : "—"}
            valueColor={
              monthly > 0
                ? isPendingAI
                  ? BANK.ai
                  : tint.monthly.value
                : BANK.muted
            }
            icon={
              isPendingAI ? (
                <Sparkles className="h-2.5 w-2.5" style={{ color: BANK.ai }} />
              ) : undefined
            }
          />
          <InlineStat
            label="المدة"
            value={
              rawMonths === null
                ? "—"
                : unrealistic
                ? "طويلة"
                : `${rawMonths} شهر`
            }
            valueColor={unrealistic ? "#8A4A2F" : BANK.ink}
          />
          <InlineStat
            label="الإنجاز"
            value={unrealistic ? "—" : rawMonths !== null ? completionLabel : "—"}
            valueColor={BANK.ink}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDetails}
            className="hidden rounded-lg p-2 text-xs font-semibold transition hover:bg-black/5 md:inline-flex"
            style={{ color: BANK.muted }}
            aria-label="تفاصيل"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-card transition hover:opacity-90"
            style={{ backgroundColor: BANK.inkAlt }}
          >
            <Pencil className="h-3.5 w-3.5" />
            تعديل الخطة
          </button>
          <div className="flex-shrink-0">
            <GoalRowMenu
              items={[
                { label: "عرض التفاصيل", onSelect: onDetails },
                { label: "تعديل الخطة", onSelect: onEdit },
                {
                  label: goal.completed ? "إلغاء الإكمال" : "وضع علامة مكتمل",
                  onSelect: onToggleComplete,
                },
                { label: "حذف الهدف", onSelect: onDelete, danger: true },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Contextual note strip (only when meaningful) */}
      {(unrealistic || aiSuggestsIncrease) && (
        <div
          className="mx-4 mb-4 flex items-start gap-2 rounded-lg px-3 py-1.5 text-[10px] sm:mx-5"
          style={{
            backgroundColor: unrealistic ? `${BANK.warn}1A` : `${BANK.ai}14`,
            color: unrealistic ? "#8A4A2F" : BANK.ai,
          }}
        >
          {unrealistic ? (
            <>
              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
              <span>المدة طويلة جداً — يوصى بزيادة الادخار الشهري لتقصيرها.</span>
            </>
          ) : (
            <>
              <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0" />
              <span>يوصي الذكاء بزيادة هذا التخصيص لتقليل مدة الهدف.</span>
            </>
          )}
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Inline stat cell inside compact goal row                             */
/* ------------------------------------------------------------------ */

interface InlineStatProps {
  label: string;
  value: string;
  valueColor: string;
  icon?: React.ReactNode;
}

function InlineStat({ label, value, valueColor, icon }: InlineStatProps) {
  return (
    <div className="min-w-0">
      <p
        className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: BANK.muted }}
      >
        {icon}
        {label}
      </p>
      <p
        className="mt-0.5 truncate text-[11px] font-bold tabular-nums sm:text-xs"
        style={{ color: valueColor }}
      >
        {value}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Completed goal row (compact, calm success)                          */
/* ------------------------------------------------------------------ */

interface CompletedGoalRowProps {
  goal: Goal;
  onToggleComplete: () => void;
  onDelete: () => void;
}

function CompletedGoalRow({ goal, onToggleComplete, onDelete }: CompletedGoalRowProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4 last:border-b-0 sm:px-6"
      style={{ borderColor: "rgba(0,0,0,0.05)" }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-lg leading-none"
          style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
          aria-hidden="true"
        >
          {categoryIcon(goal.category)}
        </span>
        <div>
          <p className="text-sm font-bold" style={{ color: BANK.ink }}>
            {goal.name}
          </p>
          <p className="text-[11px]" style={{ color: BANK.muted }}>
            تم تحقيق الهدف • تم تحويل التخصيص الشهري للهدف التالي
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5 text-[11px]">
        <div className="text-left">
          <p style={{ color: BANK.muted }}>الإنجاز</p>
          <p className="font-bold" style={{ color: "#0A5A42" }}>100%</p>
        </div>
        <div>
          <GoalRowMenu
            items={[
              { label: "إلغاء الإكمال", onSelect: onToggleComplete },
              { label: "حذف الهدف", onSelect: onDelete, danger: true },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Edit Plan drawer                                                    */
/* ------------------------------------------------------------------ */

type CalcMode = "months" | "monthly";

interface EditDrawerProps {
  goal: Goal | null;
  capacity: number;
  onClose: () => void;
}

function EditPlanDrawer({ goal, capacity, onClose }: EditDrawerProps) {
  const { editGoal } = useGoals();
  const [mode, setMode] = useState<CalcMode>("months");
  const [months, setMonths] = useState<number>(24);
  const [monthly, setMonthly] = useState<number>(0);

  useMemo(() => {
    if (goal) {
      setMonths(24);
      const current = goal.monthlyAllocation && goal.monthlyAllocation > 0
        ? goal.monthlyAllocation
        : Math.max(500, Math.round(capacity || 500));
      setMonthly(current);
    }
  }, [goal, capacity]);

  if (!goal) return null;

  const remaining = Math.max(0, goal.targetPrice - goal.allocated);

  // Mode A
  const required =
    remaining > 0 && months > 0 ? Math.ceil(remaining / months) : 0;
  const unrealistic = capacity > 0 && required > capacity * 1.25;
  const altMonths = capacity > 0 ? Math.max(1, Math.ceil(remaining / Math.max(1, capacity))) : 48;
  const altMonthly = altMonths > 0 ? Math.ceil(remaining / altMonths) : 0;
  const dateA = months > 0 ? futureDateLabel(months) : "";

  // Mode B
  const bMonths = remaining > 0 && monthly > 0 ? Math.ceil(remaining / monthly) : 0;
  const tooLong = bMonths > 120;
  const altMonthlyB = Math.ceil(remaining / 120);
  const dateB = bMonths > 0 ? futureDateLabel(bMonths) : "";

  const save = () => {
    if (mode === "months") {
      if (required <= 0) return;
      editGoal(goal.id, { monthlyAllocation: required });
    } else {
      if (monthly <= 0 || tooLong) return;
      editGoal(goal.id, { monthlyAllocation: monthly });
    }
    onClose();
  };

  return (
    <Modal open={!!goal} onClose={onClose} title={`تعديل خطة ${goal.name}`} size="md">
      <div className="space-y-5">
        {/* Mode toggle */}
        <div className="inline-flex w-full rounded-xl border border-outline bg-surface-alt p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("months")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 font-bold transition",
              mode === "months" ? "bg-card text-primary shadow-sm" : "text-ink-mute"
            )}
          >
            أحدد عدد الأشهر
          </button>
          <button
            type="button"
            onClick={() => setMode("monthly")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 font-bold transition",
              mode === "monthly" ? "bg-card text-primary shadow-sm" : "text-ink-mute"
            )}
          >
            أحدد مبلغ الادخار الشهري
          </button>
        </div>

        {mode === "months" ? (
          <div className="space-y-3">
            <Input
              label="أريد تحقيق الهدف خلال"
              type="number"
              min={1}
              inputMode="numeric"
              suffix="شهراً"
              value={months || ""}
              onChange={(e) => setMonths(Math.max(1, Number(e.target.value) || 1))}
            />
            <div className="rounded-xl border border-outline bg-surface-alt p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
                المبلغ المطلوب شهرياً
              </p>
              <p className="mt-1 text-lg font-bold text-ink">
                {required > 0 ? formatSAR(required) : "—"}
              </p>
              {dateA && (
                <p className="mt-1 text-[11px] text-ink-mute">
                  الإنجاز المتوقع: {dateA}
                </p>
              )}
            </div>
            {unrealistic && (
              <div className="rounded-xl border border-warn/30 bg-warn-light/60 p-4 text-xs leading-relaxed text-warn-dark">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div>
                    <p className="font-bold">
                      هذه الخطة غير واقعية حسب قدرتك المالية الحالية.
                    </p>
                    <p className="mt-1">
                      المدة الأنسب لك: {monthsWord(altMonths)} — الادخار المناسب:{" "}
                      {formatSAR(altMonthly)} شهرياً.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              label="أستطيع ادخار"
              type="number"
              min={1}
              inputMode="numeric"
              suffix="ر.س / شهر"
              value={monthly || ""}
              onChange={(e) => setMonthly(Math.max(0, Number(e.target.value) || 0))}
            />
            <div className="rounded-xl border border-outline bg-surface-alt p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
                المدة المتبقية
              </p>
              {tooLong ? (
                <p className="mt-1 text-sm font-bold text-warn-dark">
                  المدة طويلة جداً وغير عملية.
                </p>
              ) : (
                <p className="mt-1 text-lg font-bold text-ink">
                  {bMonths > 0 ? monthsWord(bMonths) : "—"}
                </p>
              )}
              {!tooLong && dateB && (
                <p className="mt-1 text-[11px] text-ink-mute">
                  الإنجاز المتوقع: {dateB}
                </p>
              )}
            </div>
            {tooLong && (
              <div className="rounded-xl border border-warn/30 bg-warn-light/60 p-4 text-xs leading-relaxed text-warn-dark">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>
                    لتحقيق الهدف خلال 10 سنوات، تحتاج إلى ادخار{" "}
                    <span className="font-bold">{formatSAR(altMonthlyB)}</span> شهرياً.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-outline pt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            size="sm"
            icon={<Save className="h-3.5 w-3.5" />}
            onClick={save}
            disabled={mode === "months" ? required <= 0 : monthly <= 0 || tooLong}
          >
            حفظ التعديلات
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Delete goal confirmation modal                                      */
/* ------------------------------------------------------------------ */

function DeleteGoalConfirm({
  goal,
  onCancel,
  onConfirm,
}: {
  goal: Goal | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={!!goal} onClose={onCancel} title="حذف الهدف" size="sm">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${BANK.warn}18`,
            color: BANK.warn,
          }}
          aria-hidden="true"
        >
          <Trash2 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p
            className="text-sm font-semibold leading-relaxed"
            style={{ color: BANK.ink }}
          >
            هل أنت متأكد من حذف هذا الهدف؟
          </p>
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{ color: BANK.muted }}
          >
            لن يمكن التراجع عن هذا الإجراء.
          </p>
          {goal && (
            <p
              className="mt-3 truncate rounded-lg px-3 py-2 text-xs font-bold"
              style={{
                backgroundColor: BANK.paper,
                border: `1px solid ${BANK.paperEdge}`,
                color: BANK.inkAlt,
              }}
              title={goal.name}
            >
              {goal.name}
            </p>
          )}
        </div>
      </div>

      <div
        className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4"
        style={{ borderColor: BANK.paperEdge }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-xs font-semibold transition hover:bg-black/5"
          style={{
            border: `1px solid ${BANK.paperEdge}`,
            color: BANK.ink,
            backgroundColor: "#FFFFFF",
          }}
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-card transition hover:opacity-90"
          style={{ backgroundColor: BANK.warn }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          حذف الهدف
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Advice modal                                                        */
/* ------------------------------------------------------------------ */

function AdviceModal({
  open,
  onClose,
  tips,
}: {
  open: boolean;
  onClose: () => void;
  tips: string[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="نصائح لتحسين الخطة" size="sm">
      {tips.length === 0 ? (
        <p className="text-sm text-ink-mute">
          خطتك حالياً متوازنة — لا توجد نصائح إضافية.
        </p>
      ) : (
        <ul className="space-y-3">
          {tips.map((t, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-outline bg-surface-alt p-3 text-xs leading-relaxed text-ink"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Lightbulb className="h-3.5 w-3.5" />
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          icon={<X className="h-3.5 w-3.5" />}
          onClick={onClose}
        >
          إغلاق
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type Filter = "all" | "high" | "medium" | "low";

/* ------------------------------------------------------------------ */
/* Tinted summary card                                                 */
/* ------------------------------------------------------------------ */

interface TintedSummaryProps {
  bg: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  eyebrow: string;
  value: string;
  hint?: string;
  action?: React.ReactNode;
}

interface StripStatProps {
  icon: React.ReactNode;
  eyebrow: string;
  value: string;
  hint?: string;
}

function StripStat({ icon, eyebrow, value, hint }: StripStatProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl p-4"
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BANK.paperEdge}`,
      }}
    >
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: BANK.paper, color: BANK.inkAlt }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: BANK.muted }}
        >
          {eyebrow}
        </p>
        <p
          className="mt-1 truncate text-base font-bold tabular-nums sm:text-lg"
          style={{ color: BANK.ink }}
        >
          {value}
        </p>
        {hint && (
          <p className="mt-0.5 truncate text-[10px]" style={{ color: BANK.muted }}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

function TintedSummary({
  bg,
  iconBg,
  iconColor,
  icon,
  eyebrow,
  value,
  hint,
  action,
}: TintedSummaryProps) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: bg, border: "1px solid rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </span>
        <div className="flex-1 text-left">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: BANK.muted }}
          >
            {eyebrow}
          </p>
          <p
            className="mt-1 text-base font-bold leading-tight tabular-nums sm:text-lg"
            style={{ color: BANK.ink }}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-[10px]" style={{ color: BANK.muted }}>
              {hint}
            </p>
          )}
          {action && <div className="mt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lavender "next update" summary card                                 */
/* ------------------------------------------------------------------ */

function LavenderMonthlyCard() {
  const { monthlyStatus } = useCheckin();
  const { state, daysDisplay, completedMonthLabel, nextInDays } = monthlyStatus;

  const bg = "#EDECF9";
  const iconBg = "#D5D2EF";
  const iconColor = "#4C4A9C";

  if (state === "completed") {
    return (
      <TintedSummary
        bg={bg}
        iconBg={iconBg}
        iconColor={iconColor}
        icon={<CalendarCheck className="h-4 w-4" />}
        eyebrow="التحديث القادم"
        value={`تم تحديث شهر ${completedMonthLabel ?? ""}`}
        hint={nextInDays > 0 ? `التالي بعد ${daysWord(nextInDays)}` : "قريباً"}
      />
    );
  }

  if (state === "due") {
    return (
      <TintedSummary
        bg={bg}
        iconBg={iconBg}
        iconColor={iconColor}
        icon={<CalendarCheck className="h-4 w-4" />}
        eyebrow="التحديث القادم"
        value="حان وقت التحديث"
        action={
          <Link to="/app/checkin">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: BANK.ai }}
            >
              حدّث الآن
            </button>
          </Link>
        }
      />
    );
  }

  if (state === "overdue") {
    return (
      <TintedSummary
        bg={bg}
        iconBg={iconBg}
        iconColor={iconColor}
        icon={<CalendarClock className="h-4 w-4" />}
        eyebrow="التحديث القادم"
        value={`متأخر منذ ${daysWord(daysDisplay)}`}
        action={
          <Link to="/app/checkin">
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: BANK.inkAlt }}
            >
              حدّث الآن
            </button>
          </Link>
        }
      />
    );
  }

  return (
    <TintedSummary
      bg={bg}
      iconBg={iconBg}
      iconColor={iconColor}
      icon={<CalendarClock className="h-4 w-4" />}
      eyebrow="التحديث القادم"
      value={`بعد ${daysWord(daysDisplay)}`}
      hint={monthlyStatus.nextDueISO ? formatDate(monthlyStatus.nextDueISO) : undefined}
    />
  );
}

export function SavingsPlanPage() {
  const { goals, activeGoals, deleteGoal, setCompleted, editGoal } = useGoals();
  const { result } = useAnalysis();
  const { monthlyStatus, history: checkinHistory } = useCheckin();
  const { push } = useNotifications();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [details, setDetails] = useState<Goal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null);
  const [adviceOpen, setAdviceOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const capacity = Math.max(0, result?.monthlySavings ?? 0);

  const recommendation = useMemo(
    () => buildRecommendation(activeGoals, goals, capacity),
    [activeGoals, goals, capacity]
  );

  const acceptRecommendation = () => {
    if (recommendation.overflow || recommendation.totalMonthly <= 0) return;
    let applied = 0;
    for (const p of recommendation.plans) {
      if (p.isComplete) {
        // Ensure completed goals never keep a stale monthly allocation.
        if ((p.goal.monthlyAllocation ?? 0) !== 0) {
          editGoal(p.goal.id, { monthlyAllocation: 0 });
        }
        continue;
      }
      editGoal(p.goal.id, { monthlyAllocation: p.monthly });
      applied += p.monthly;
    }
    push({
      title: "تم اعتماد التوزيع المقترح",
      body: `تم توزيع ${formatSAR(applied)} شهرياً على أهدافك النشطة.`,
      severity: "ok",
    });
  };

  const displayed = useMemo(() => {
    const list = filter === "all" ? goals : goals.filter((g) => g.priority === filter);
    return sortGoals(list);
  }, [goals, filter]);

  const activeDisplayed = useMemo(
    () => displayed.filter((g) => !g.completed && g.allocated < g.targetPrice),
    [displayed]
  );
  const completedDisplayed = useMemo(
    () => displayed.filter((g) => g.completed || g.allocated >= g.targetPrice),
    [displayed]
  );

  const totalRemaining = useMemo(
    () =>
      activeGoals.reduce((s, g) => s + Math.max(0, g.targetPrice - g.allocated), 0),
    [activeGoals]
  );

  const totalMonthly = useMemo(
    () =>
      activeGoals.reduce((s, g) => s + Math.max(0, g.monthlyAllocation ?? 0), 0),
    [activeGoals]
  );

  const priorityCounts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    for (const g of activeGoals) c[g.priority]++;
    return c;
  }, [activeGoals]);

  const priorityHint = useMemo(() => {
    const parts: string[] = [];
    if (priorityCounts.high > 0) parts.push(`${priorityCounts.high} عالية`);
    if (priorityCounts.medium > 0) parts.push(`${priorityCounts.medium} متوسطة`);
    if (priorityCounts.low > 0) parts.push(`${priorityCounts.low} منخفضة`);
    return parts.join(" • ") || "لا توجد أهداف نشطة";
  }, [priorityCounts]);

  const tips = useMemo<string[]>(() => {
    const items: string[] = [];
    if (activeGoals.length === 0) return items;

    // Tip 1 — impact of +300 SAR/month on the top-priority goal
    const top = sortGoals(activeGoals)[0];
    if (top && top.monthlyAllocation && top.monthlyAllocation > 0) {
      const rem = Math.max(0, top.targetPrice - top.allocated);
      if (rem > 0) {
        const curr = Math.ceil(rem / top.monthlyAllocation);
        const next = Math.ceil(rem / (top.monthlyAllocation + 300));
        const saved = curr - next;
        if (saved >= 1) {
          items.push(
            `زيادة الادخار بمقدار 300 ر.س شهرياً تُقلّل مدة "${top.name}" بنحو ${monthsWord(saved)}.`
          );
        }
      }
    }

    // Tip 2 — focus on top priority when more than one
    if (activeGoals.length > 1) {
      items.push(
        "التركيز على الهدف الأعلى أولوية أولاً يساعدك على الإنجاز أسرع بدل توزيع الادخار على عدة أهداف."
      );
    }

    // Tip 3 — unallocated monthly capacity from analysis
    if (capacity > 0 && totalMonthly < capacity) {
      const gap = capacity - totalMonthly;
      items.push(
        `لديك ${formatSAR(gap)} من قدرتك الشهرية غير موزّعة — تخصيصها لأحد الأهداف يرفع سرعة الإنجاز.`
      );
    }

    return items.slice(0, 3);
  }, [activeGoals, capacity, totalMonthly]);

  // Latest check-in label for the Monthly Update card
  const AR_MONTHS_LOCAL = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ];
  const lastCheckinLabel = useMemo(() => {
    const sorted = [...checkinHistory].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    const last = sorted[sorted.length - 1];
    if (!last) return null;
    const [y, m] = last.monthKey.split("-").map(Number);
    return `${AR_MONTHS_LOCAL[Math.max(0, Math.min(11, m - 1))]} ${y}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkinHistory]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* 1) Header — bank-style, dark navy Add Goal button on the LEFT (RTL) */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:opacity-90"
          style={{ backgroundColor: BANK.inkAlt }}
        >
          <Plus className="h-4 w-4" />
          إضافة هدف
        </button>

        <div className="flex items-start gap-3 text-right">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: BANK.muted }}
            >
              خطة الادخار
            </p>
            <h1
              className="mt-1 text-2xl font-bold md:text-3xl"
              style={{ color: BANK.ink }}
            >
              خطة الادخار الذكية
            </h1>
            <p className="mt-1 max-w-md text-sm" style={{ color: BANK.muted }}>
              نخطط معاً لتحقيق أهدافك المالية خطوة بخطوة.
            </p>
          </div>
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-card"
            style={{ backgroundColor: BANK.inkAlt }}
          >
            <Target className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 2) Four compact summary cards — premium bank strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StripStat
          icon={<CalendarClock className="h-4 w-4" />}
          eyebrow="آخر تحديث"
          value={lastCheckinLabel ?? "لم يبدأ بعد"}
          hint={
            monthlyStatus.state === "due"
              ? "حان وقت التحديث"
              : monthlyStatus.state === "overdue"
              ? `متأخر منذ ${daysWord(monthlyStatus.daysDisplay)}`
              : monthlyStatus.state === "completed"
              ? `التالي بعد ${daysWord(monthlyStatus.nextInDays)}`
              : `بعد ${daysWord(monthlyStatus.daysDisplay)}`
          }
        />
        <StripStat
          icon={<Coins className="h-4 w-4" />}
          eyebrow="القدرة الشهرية"
          value={formatSAR(capacity)}
          hint="القدرة الآمنة على الادخار"
        />
        <StripStat
          icon={<Wallet className="h-4 w-4" />}
          eyebrow="الإجمالي المتبقي"
          value={formatSAR(totalRemaining)}
          hint="مجموع المتبقي لكل الأهداف"
        />
        <StripStat
          icon={<Flag className="h-4 w-4" />}
          eyebrow="الأهداف النشطة"
          value={`${activeGoals.length}`}
          hint={priorityHint}
        />
      </div>

      {/* AI Recommendation — main visual centerpiece */}
      <AIRecommendationCard
        rec={recommendation}
        onAccept={acceptRecommendation}
        onEdit={() => {
          if (recommendation.currentPriorityGoal) {
            setEditing(recommendation.currentPriorityGoal);
          }
        }}
        onWhy={() => setWhyOpen(true)}
      />

      {/* 5) Active goals — section header + free-standing cards */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: BANK.muted }}
            >
              الأهداف النشطة
            </p>
            <h2
              className="mt-1 text-lg font-bold sm:text-xl"
              style={{ color: BANK.ink }}
            >
              أهدافك
            </h2>
            <p className="mt-1 max-w-lg text-xs" style={{ color: BANK.muted }}>
              ركز على ما يهمك الآن.
            </p>
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition hover:bg-black/5"
              style={{
                border: `1px solid ${BANK.paperEdge}`,
                color: BANK.ink,
                backgroundColor: "#FFFFFF",
              }}
            >
              <span style={{ color: BANK.muted }}>عرض:</span>
              {filter === "all"
                ? "جميع الأهداف"
                : filter === "high"
                ? "عالية الأولوية"
                : filter === "medium"
                ? "متوسطة الأولوية"
                : "منخفضة الأولوية"}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {filterOpen && (
              <div
                className="absolute left-0 top-11 z-10 w-48 overflow-hidden rounded-xl shadow-elevated"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${BANK.paperEdge}`,
                }}
              >
                {(
                  [
                    ["all", "جميع الأهداف"],
                    ["high", "عالية الأولوية"],
                    ["medium", "متوسطة الأولوية"],
                    ["low", "منخفضة الأولوية"],
                  ] as [Filter, string][]
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setFilter(k);
                      setFilterOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-right text-xs transition hover:bg-black/5"
                    style={{
                      color: filter === k ? BANK.ink : BANK.muted,
                      fontWeight: filter === k ? 700 : 500,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Empty state */}
        {displayed.length === 0 && (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{
              backgroundColor: "#FFFFFF",
              border: `1px dashed ${BANK.paperEdge}`,
            }}
          >
            <p className="text-sm" style={{ color: BANK.muted }}>
              لا توجد أهداف بعد — استخدم "إضافة هدف" لبدء أول هدف لك.
            </p>
          </div>
        )}

        {/* Active goal cards — free-standing premium banking cards */}
        {activeDisplayed.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {activeDisplayed.map((g, idx) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  layout
                >
                  <GoalRow
                    goal={g}
                    order={idx + 1}
                    aiSuggestedMonthly={recommendation.perGoalMonthly[g.id]}
                    onEdit={() => setEditing(g)}
                    onDetails={() => setDetails(g)}
                    onDelete={() => setPendingDelete(g)}
                    onToggleComplete={() => setCompleted(g.id, !g.completed)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Completed subsection (collapsible, soft mint) */}
        {completedDisplayed.length > 0 && (
          <div
            className="mt-4 overflow-hidden rounded-2xl"
            style={{
              backgroundColor: "#E4F1EC",
              border: "1px solid rgba(0,0,0,0.04)",
            }}
          >
            <button
              type="button"
              onClick={() => setCompletedExpanded((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-right transition hover:bg-black/[0.03] sm:px-6"
              aria-expanded={completedExpanded}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#B8DBCB", color: "#0A5A42" }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <p className="text-sm font-bold" style={{ color: BANK.ink }}>
                  الأهداف المكتملة
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: "#B8DBCB", color: "#0A5A42" }}
                >
                  {completedDisplayed.length === 1
                    ? "هدف واحد مكتمل"
                    : completedDisplayed.length === 2
                    ? "هدفان مكتملان"
                    : `${completedDisplayed.length} أهداف مكتملة`}
                </span>
              </div>
              <ChevronLeft
                className="h-4 w-4 transition-transform"
                style={{
                  color: BANK.muted,
                  transform: completedExpanded ? "rotate(-90deg)" : "rotate(0)",
                }}
              />
            </button>

            {completedExpanded && (
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                <AnimatePresence initial={false}>
                  {completedDisplayed.map((g) => (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      layout
                    >
                      <CompletedGoalRow
                        goal={g}
                        onToggleComplete={() =>
                          setCompleted(g.id, !g.completed)
                        }
                        onDelete={() => setPendingDelete(g)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Savings Wallet — placed between the goals list and the bottom row.
          Purely additive; no existing sections were moved or resized. */}
      <WalletCard />

      {/* 6+7) Bottom row — Monthly Update (navy) + Smart Tips (peach) side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Monthly Update — navy card */}
        <section
          className="relative flex flex-col overflow-hidden rounded-3xl p-5 shadow-card sm:p-6"
          style={{
            background: `linear-gradient(135deg, ${BANK.inkAlt} 0%, #0A2444 100%)`,
          }}
        >
          <div
            className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(131,127,216,0.28)" }}
            aria-hidden="true"
          />
          <div className="relative flex flex-1 flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(131,127,216,0.22)", color: "#E7E5F8" }}
              >
                {monthlyStatus.state === "overdue" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : monthlyStatus.state === "due" ? (
                  <CalendarCheck className="h-5 w-5" />
                ) : (
                  <CalendarClock className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: "rgba(244,241,236,0.6)" }}
                >
                  {lastCheckinLabel ? `آخر تحديث: ${lastCheckinLabel}` : "لم يتم بعد أي تحديث شهري"}
                </p>
                <h3 className="mt-1 text-base font-bold sm:text-lg" style={{ color: "#F4F1EC" }}>
                  التحديث الشهري القادم
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "rgba(244,241,236,0.7)" }}>
                  {monthlyStatus.state === "completed"
                    ? `تم تحديث شهر ${monthlyStatus.completedMonthLabel ?? ""} — التالي بعد ${daysWord(monthlyStatus.nextInDays)}`
                    : monthlyStatus.state === "due"
                    ? "حان وقت التحديث — سجّل ما ادخرته هذا الشهر."
                    : monthlyStatus.state === "overdue"
                    ? `متأخر منذ ${daysWord(monthlyStatus.daysDisplay)} — حدّث ادخارك الآن.`
                    : `التحديث القادم بعد ${daysWord(monthlyStatus.daysDisplay)}.`}
                </p>
              </div>
            </div>
            <Link to="/app/checkin">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:opacity-90 sm:w-auto"
                style={{ backgroundColor: BANK.ai }}
              >
                <CalendarCheck className="h-4 w-4" />
                تحديث ادخار هذا الشهر
              </button>
            </Link>
          </div>
        </section>

        {/* Smart Tips — soft peach card */}
        <section
          className="relative flex flex-col overflow-hidden rounded-3xl p-5 sm:p-6"
          style={{
            backgroundColor: "#FBEDE5",
            border: "1px solid rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "#F4D7C6", color: "#8A4A2F" }}
              >
                <Lightbulb className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: BANK.muted }}
                >
                  نصائح الذكاء
                </p>
                <h3
                  className="mt-1 text-base font-bold sm:text-lg"
                  style={{ color: BANK.ink }}
                >
                  نصائح لتحسين خطتك
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: BANK.muted }}>
                  نصائح بسيطة تساعدك على تحقيق أهدافك أسرع.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAdviceOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition hover:opacity-90 sm:w-auto"
              style={{
                border: `1px solid ${BANK.paperEdge}`,
                backgroundColor: "#FFFFFF",
                color: BANK.ink,
              }}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              عرض النصائح
            </button>
          </div>
        </section>
      </div>

      {/* Modals */}
      <AddGoalModal open={addOpen} onClose={() => setAddOpen(false)} />
      <EditPlanDrawer
        goal={editing}
        capacity={capacity}
        onClose={() => setEditing(null)}
      />
      <AdviceModal open={adviceOpen} onClose={() => setAdviceOpen(false)} tips={tips} />
      <WhyModal
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
        reasons={recommendation.reasons}
      />
      <GoalDetailsModal goal={details} onClose={() => setDetails(null)} />
      <DeleteGoalConfirm
        goal={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const g = pendingDelete;
          deleteGoal(g.id);
          push({
            title: "تم حذف الهدف",
            body: `تم حذف "${g.name}" من قائمة أهدافك.`,
            severity: "info",
          });
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Goal details (read-only quick sheet)                                */
/* ------------------------------------------------------------------ */

function GoalDetailsModal({
  goal,
  onClose,
}: {
  goal: Goal | null;
  onClose: () => void;
}) {
  if (!goal) return null;
  const remaining = Math.max(0, goal.targetPrice - goal.allocated);
  const monthly = Math.max(0, goal.monthlyAllocation ?? 0);
  const isComplete = remaining === 0;
  const months = isComplete
    ? null
    : monthly > 0
    ? Math.ceil(remaining / monthly)
    : null;
  const pct =
    goal.targetPrice > 0
      ? Math.min(100, Math.round((goal.allocated / goal.targetPrice) * 100))
      : 0;

  return (
    <Modal open={!!goal} onClose={onClose} title={`تفاصيل ${goal.name}`} size="sm">
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-mute">الأولوية</span>
          <span className="font-bold text-ink">{PRIORITY_META[goal.priority].label}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-mute">المبلغ المستهدف</span>
          <span className="font-bold text-ink">{formatSAR(goal.targetPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-mute">المدخر</span>
          <span className="font-bold text-ink">{formatSAR(goal.allocated)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-mute">المتبقي</span>
          <span className="font-bold text-ink">{formatSAR(remaining)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-mute">نسبة الإنجاز</span>
          <span className="font-bold text-ink">{pct}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-mute">الادخار الشهري</span>
          <span className="font-bold text-ink">
            {isComplete ? "متوقف" : monthly > 0 ? formatSAR(monthly) : "لم يُعتمد بعد"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-mute">المدة المتبقية</span>
          <span className="font-bold text-ink">
            {isComplete ? "مكتمل" : months !== null ? monthsWord(months) : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-mute">الإنجاز المتوقع</span>
          <span className="font-bold text-ink">
            {isComplete
              ? "تم تحقيق الهدف"
              : months !== null
              ? futureDateLabel(months)
              : "—"}
          </span>
        </div>
        {goal.targetDate && (
          <div className="flex justify-between">
            <span className="text-ink-mute">التاريخ المستهدف</span>
            <span className="font-bold text-ink">{formatDate(goal.targetDate)}</span>
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          icon={<X className="h-3.5 w-3.5" />}
          onClick={onClose}
        >
          إغلاق
        </Button>
      </div>
    </Modal>
  );
}

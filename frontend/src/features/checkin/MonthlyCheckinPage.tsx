import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  CalendarDays,
  ArrowLeft,
  CheckCircle2,
  Wallet,
  Clock3,
  ArrowUpRight,
  BarChart2,
  ChevronLeft,
  Rocket,
  AlertTriangle,
  Sparkles,
  Smile,
  Meh,
  Frown,
  Star,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CreditCard,
  Lightbulb,
} from "lucide-react";
import { Button } from "../../components/shared/Button";
import { EmptyState } from "../../components/shared/EmptyState";
import { LoadingOverlay } from "../../components/shared/LoadingOverlay";
import { useAnalysis } from "../analysis/analysisStore";
import { useCheckin } from "./checkinStore";
import { useActivePlan, applyActivePlan } from "../savingsPlan/activePlanStore";
import { useGoals } from "../goals/goalsStore";
import { distributeAI } from "../goals/aiAllocation";
import { api } from "../../lib/api";
import {
  AnalysisInput,
  AnalysisResult,
  CheckinAllocation,
  CheckinFeedback,
  CheckinRecord,
  CheckinStatus,
} from "../../types";
import { cn, formatDate, formatSAR } from "../../lib/format";

/* ------------------------------------------------------------------ */
/* Bank palette (Monthly Check-in only)                                */
/* ------------------------------------------------------------------ */

const BANK = {
  paper:    "#fcf8f5",
  ink:      "#02151e",
  inkAlt:   "#002134",
  muted:    "#3f3c3e",
  accent:   "#d58d79",
  ai:       "#837fd8",
  paperEdge:"#EDE7DE",
} as const;

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const STATUS_META: Record<
  CheckinStatus,
  { label: string; tone: "ok" | "primary" | "warn"; gradient: string }
> = {
  ahead: { label: "متقدم", tone: "ok", gradient: "from-ok to-primary" },
  on_track: {
    label: "على المسار",
    tone: "primary",
    gradient: "from-primary to-primary-dark",
  },
  behind: { label: "متأخر", tone: "warn", gradient: "from-warn to-danger" },
};

// ---------- Mood + Event catalogues ----------

type Mood = "excellent" | "good" | "average" | "difficult";
interface MoodOption {
  key: Mood;
  label: string;
  icon: React.ReactNode;
}
const MOODS: MoodOption[] = [
  { key: "excellent", label: "ممتاز",  icon: <Star className="h-5 w-5" /> },
  { key: "good",      label: "جيد",    icon: <Smile className="h-5 w-5" /> },
  { key: "average",   label: "متوسط",  icon: <Meh className="h-5 w-5" /> },
  { key: "difficult", label: "صعب",    icon: <Frown className="h-5 w-5" /> },
];

type MonthlyEvent =
  | "none"
  | "salary_up"
  | "salary_down"
  | "bonus"
  | "extra_income"
  | "new_commitments"
  | "loan_paid_off"
  | "unexpected_expense"
  | "other";

const EVENTS: { key: MonthlyEvent; label: string }[] = [
  { key: "none", label: "لا شيء تغيّر" },
  { key: "salary_up", label: "زيادة في الراتب" },
  { key: "salary_down", label: "تخفيض في الراتب" },
  { key: "bonus", label: "مكافأة" },
  { key: "extra_income", label: "دخل إضافي" },
  { key: "new_commitments", label: "التزامات شهرية جديدة" },
  { key: "loan_paid_off", label: "سداد قرض" },
  { key: "unexpected_expense", label: "مصروف غير متوقع" },
  { key: "other", label: "غير ذلك" },
];

// Which events surface a conditional numeric input, and what label to show.
const EVENT_INPUT: Partial<Record<MonthlyEvent, { label: string; placeholder: string; help?: string }>> = {
  salary_up: { label: "الراتب الشهري الجديد", placeholder: "مثال: 22000" },
  salary_down: { label: "الراتب الشهري الجديد", placeholder: "مثال: 15000" },
  new_commitments: { label: "قيمة الالتزام الشهري الجديد", placeholder: "مثال: 800" },
  loan_paid_off: { label: "قيمة القرض الذي تم سداده", placeholder: "مثال: 12000" },
  unexpected_expense: { label: "قيمة المصروف غير المتوقع", placeholder: "مثال: 3500" },
  bonus: { label: "قيمة المكافأة", placeholder: "مثال: 5000" },
  extra_income: { label: "قيمة الدخل الإضافي", placeholder: "مثال: 2000" },
};

// ---------- Component ----------

export function MonthlyCheckinPage() {
  const { input, result, hasAnalysis, setAnalysis } = useAnalysis();
  const { hasCurrentMonth, add, currentMonthKey, history } = useCheckin();
  const { plan: activePlan } = useActivePlan();
  const { activeGoals, applyMonthlyDistribution } = useGoals();
  const navigate = useNavigate();

  const [savedThisMonth, setSavedThisMonth] = useState<number>(0);
  const [mood, setMood] = useState<Mood | null>(null);
  const [event, setEvent] = useState<MonthlyEvent>("none");
  const [eventAmount, setEventAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  // Multi-goal distribution — user-editable per-goal split of savedThisMonth
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [aiSuggestedFor, setAiSuggestedFor] = useState<number>(-1);

  interface SuccessData {
    feedback: CheckinFeedback;
    savedThisMonth: number;
    newProgress: number;
    newEstimate: string;
    timelineDeltaMonths: number; // positive = improved, negative = delayed
    monthLabel: string;
  }
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const monthLabel = useMemo(() => {
    const d = new Date();
    return `${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  // Effective months used to compute the planned monthly (respects Custom Plan mode)
  const effectiveMonths = useMemo(() => {
    if (!input) return 12;
    return activePlan.mode === "custom" ? activePlan.customMonths : input.targetMonths;
  }, [input, activePlan]);

  const plannedMonthly = useMemo(() => {
    if (!input) return 0;
    return Math.max(
      0,
      Math.round(Math.max(0, input.goalPrice - input.savings) / Math.max(1, effectiveMonths))
    );
  }, [input, effectiveMonths]);

  // AI suggested distribution across active goals.
  const aiDistribution = useMemo(() => {
    if (activeGoals.length === 0 || savedThisMonth <= 0) return { perGoal: {}, reason: "" };
    return distributeAI(savedThisMonth, activeGoals, "monthly");
  }, [savedThisMonth, activeGoals]);

  // Sync the distribution with the AI suggestion when the amount changes.
  useEffect(() => {
    if (activeGoals.length === 0 || savedThisMonth <= 0) return;
    if (savedThisMonth === aiSuggestedFor) return;
    setAiSuggestedFor(savedThisMonth);
    setDistribution(aiDistribution.perGoal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedThisMonth, activeGoals.length]);

  const distributionTotal = Object.values(distribution).reduce(
    (s, v) => s + Math.max(0, v || 0),
    0
  );
  const distributionUnallocated = Math.max(0, savedThisMonth - distributionTotal);
  const distributionOverflow = Math.max(0, distributionTotal - savedThisMonth);

  // ---------- Empty state ----------
  if (!hasAnalysis || !input || !result) {
    return (
      <div className="mx-auto max-w-3xl">
        <PremiumHeader />
        <div
          className="mt-8 rounded-3xl p-6 shadow-card"
          style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BANK.paperEdge}` }}
        >
          <EmptyState
            icon={<BarChart2 className="h-6 w-6" />}
            title="لا يوجد تحليل"
            description="ابدأ بتحليل مالي مرة واحدة، ثم استخدم التحديث الشهري."
            action={
              <Link to="/app/financial-analysis">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-card transition hover:opacity-90"
                  style={{ backgroundColor: BANK.accent }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  ابدأ التحليل المالي
                </button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // ---------- Dynamic summary (live before submit) ----------
  const conditional = EVENT_INPUT[event];
  const canSubmit = savedThisMonth >= 0; // only savings is required

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PremiumHeader />

      {/* Monthly Status Card */}
      <MonthlyStatusCard
        monthLabel={monthLabel}
        history={history}
        currentKey={currentMonthKey}
        hasCurrentMonth={hasCurrentMonth}
        onOpenPlan={() => navigate("/app/savings-plan")}
      />

      {/* Success screen */}
      <AnimatePresence>
        {success && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <SuccessScreen
              data={success}
              onOpenPlan={() => navigate("/app/savings-plan")}
              onDone={() => navigate("/app/financial-analysis")}
            />

            {/* AI Behavioral Review — After-Decision stage */}
            <AIBehavioralReviewCard
              savedThisMonth={success.savedThisMonth}
              plannedMonthly={plannedMonthly}
              timelineDeltaMonths={success.timelineDeltaMonths}
              history={history}
              event={event}
              financialStability={result?.financialStability ?? 0}
              status={success.feedback.status}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Progress form — ONE elegant container with three sections */}
      {!success && (
        <section
          className="rounded-3xl p-6 shadow-card sm:p-8"
          style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BANK.paperEdge}` }}
        >
          {/* SECTION 1 — Required */}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ backgroundColor: `${BANK.accent}22`, color: "#8A4A2F" }}
              >
                مطلوب
              </span>
            </div>
            <h3 className="mt-3 text-lg font-bold sm:text-xl" style={{ color: BANK.ink }}>
              كم ادّخرت هذا الشهر؟
            </h3>
            <p className="mt-1 text-xs" style={{ color: BANK.muted }}>
              أدخل المبلغ الذي استطعت ادخاره هذا الشهر.
            </p>

            <div
              className="mt-4 flex items-center gap-4 rounded-2xl px-4 py-3 transition focus-within:ring-4"
              style={{
                backgroundColor: BANK.paper,
                border: `1px solid ${BANK.paperEdge}`,
                // subtle focus ring via inline style — cannot be done cleanly, use CSS var
                ["--tw-ring-color" as string]: `${BANK.accent}25`,
              }}
            >
              <span
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#FFFFFF", color: BANK.inkAlt }}
              >
                <Wallet className="h-5 w-5" />
              </span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={savedThisMonth || ""}
                onChange={(e) =>
                  setSavedThisMonth(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="0"
                className="flex-1 bg-transparent text-3xl font-bold tabular-nums focus:outline-none sm:text-4xl"
                style={{ color: BANK.ink }}
              />
              <span
                className="text-sm font-semibold"
                style={{ color: BANK.muted }}
              >
                ر.س
              </span>
            </div>
          </div>

          <div className="my-8 h-px" style={{ backgroundColor: BANK.paperEdge }} />

          {/* SECTION 2 — Optional mood */}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ backgroundColor: `${BANK.paperEdge}`, color: BANK.muted }}
              >
                اختياري
              </span>
            </div>
            <h3 className="mt-3 text-lg font-bold sm:text-xl" style={{ color: BANK.ink }}>
              كيف كان وضعك المالي هذا الشهر؟
            </h3>
            <p className="mt-1 text-xs" style={{ color: BANK.muted }}>
              يساعدنا على تخصيص التوصيات لك.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MOODS.map((m) => {
                const active = mood === m.key;
                return (
                  <motion.button
                    key={m.key}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setMood(active ? null : m.key)}
                    className="flex flex-col items-center gap-2 rounded-2xl px-3 py-4 transition"
                    style={{
                      backgroundColor: active ? `${BANK.accent}18` : "#FFFFFF",
                      border: `1px solid ${active ? BANK.accent : BANK.paperEdge}`,
                      color: active ? "#8A4A2F" : BANK.ink,
                      boxShadow: active
                        ? "0 4px 12px rgba(213,141,121,0.18)"
                        : "none",
                    }}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: active ? "#FFFFFF" : BANK.paper,
                        color: active ? BANK.accent : BANK.inkAlt,
                      }}
                    >
                      {m.icon}
                    </span>
                    <span className="text-xs font-bold">{m.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="my-8 h-px" style={{ backgroundColor: BANK.paperEdge }} />

          {/* SECTION 3 — Optional event */}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ backgroundColor: `${BANK.paperEdge}`, color: BANK.muted }}
              >
                اختياري
              </span>
            </div>
            <h3 className="mt-3 text-lg font-bold sm:text-xl" style={{ color: BANK.ink }}>
              هل حدث تغيير مالي مهم؟
            </h3>
            <p className="mt-1 text-xs" style={{ color: BANK.muted }}>
              اختر إن وجد.
            </p>

            <div className="relative mt-4">
              <select
                value={event}
                onChange={(e) => {
                  setEvent(e.target.value as MonthlyEvent);
                  setEventAmount(0);
                }}
                className="w-full appearance-none rounded-2xl px-4 py-3.5 pl-10 text-sm font-semibold transition focus:outline-none"
                style={{
                  backgroundColor: BANK.paper,
                  border: `1px solid ${BANK.paperEdge}`,
                  color: BANK.ink,
                }}
              >
                {EVENTS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: BANK.muted }}
              />
            </div>

            <AnimatePresence initial={false}>
              {conditional && (
                <motion.div
                  key={event}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div
                    className="mt-3 rounded-2xl p-4"
                    style={{
                      backgroundColor: BANK.paper,
                      border: `1px solid ${BANK.paperEdge}`,
                    }}
                  >
                    <label
                      className="block text-[11px] font-semibold"
                      style={{ color: BANK.muted }}
                    >
                      {conditional.label}
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={eventAmount || ""}
                        onChange={(e) =>
                          setEventAmount(Math.max(0, Number(e.target.value) || 0))
                        }
                        placeholder={conditional.placeholder}
                        className="flex-1 bg-transparent text-lg font-bold tabular-nums focus:outline-none"
                        style={{ color: BANK.ink }}
                      />
                      <span
                        className="text-xs font-semibold"
                        style={{ color: BANK.muted }}
                      >
                        ر.س
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DYNAMIC SUMMARY */}
          {savedThisMonth > 0 && (
            <DynamicSummary
              savedThisMonth={savedThisMonth}
              plannedMonthly={plannedMonthly}
              input={input}
              event={event}
              eventAmount={eventAmount}
              effectiveMonths={effectiveMonths}
            />
          )}

          {/* MULTI-GOAL DISTRIBUTION */}
          {savedThisMonth > 0 && activeGoals.length > 1 && (
            <div
              className="mt-8 rounded-2xl p-5"
              style={{
                backgroundColor: BANK.paper,
                border: `1px solid ${BANK.paperEdge}`,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: BANK.ai }}
                  >
                    توزيع المدخر هذا الشهر
                  </p>
                  <p className="mt-1 text-xs" style={{ color: BANK.muted }}>
                    اقتراح ذكي يمكنك تعديله أو ترك جزء غير موزّع.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDistribution(aiDistribution.perGoal);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition hover:opacity-90"
                  style={{
                    backgroundColor: `${BANK.ai}18`,
                    color: BANK.ai,
                    border: `1px solid ${BANK.ai}44`,
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                  استخدام اقتراح AI
                </button>
              </div>

              <ul className="mt-4 space-y-2">
                {activeGoals.map((g) => {
                  const val = Math.max(0, distribution[g.id] ?? 0);
                  return (
                    <li
                      key={g.id}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: "#FFFFFF" }}
                    >
                      <span
                        className="flex-1 truncate text-sm font-bold"
                        style={{ color: BANK.ink }}
                        title={g.name}
                      >
                        {g.name}
                      </span>
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={val || ""}
                        onChange={(e) => {
                          const n = Math.max(0, Number(e.target.value) || 0);
                          setDistribution((prev) => ({ ...prev, [g.id]: n }));
                        }}
                        className="w-28 rounded-lg px-2 py-1 text-sm font-bold tabular-nums focus:outline-none"
                        style={{
                          backgroundColor: BANK.paper,
                          border: `1px solid ${BANK.paperEdge}`,
                          color: BANK.ink,
                        }}
                      />
                      <span
                        className="text-xs font-semibold"
                        style={{ color: BANK.muted }}
                      >
                        ر.س
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <SmallTotal label="المُوَزَّع" value={formatSAR(distributionTotal)} tone="ai" />
                <SmallTotal
                  label="غير موزّع"
                  value={formatSAR(distributionUnallocated)}
                  tone={distributionUnallocated > 0 ? "accent" : "muted"}
                />
                <SmallTotal
                  label="مجموع الادخار"
                  value={formatSAR(savedThisMonth)}
                />
              </div>

              {distributionOverflow > 0 && (
                <div
                  className="mt-3 rounded-lg p-2 text-[11px]"
                  style={{
                    backgroundColor: `${BANK.accent}22`,
                    color: "#8A4A2F",
                    border: `1px solid ${BANK.accent}55`,
                  }}
                >
                  التوزيع يتجاوز المبلغ المدّخر بمقدار {formatSAR(distributionOverflow)}.
                </div>
              )}
            </div>
          )}

          {error && (
            <div
              className="mt-6 rounded-xl p-3 text-xs"
              style={{
                backgroundColor: `${BANK.accent}22`,
                color: "#8A2F2A",
                border: `1px solid ${BANK.accent}55`,
              }}
            >
              {error}
            </div>
          )}

          {/* Primary Action */}
          <div className="mt-8">
            <button
              type="button"
              onClick={async () => {
                if (!canSubmit) return;
                setError(null);
                setSubmitting(true);
                try {
                  const savedAmount = Number(savedThisMonth) || 0;

                  // Apply event side effects to the *stored* input snapshot.
                  const nextInput = applyEventToInput(input, event, eventAmount, savedAmount);

                  // Backend request uses active plan (Custom Plan mode) if applicable.
                  const scopedNextInput = applyActivePlan(nextInput, activePlan);
                  const { data: nextResult } = await api.post<AnalysisResult>(
                    "/analysis",
                    scopedNextInput
                  );

                  const { data: feedback } = await api.post<CheckinFeedback>("/checkin", {
                    goal: input.goal,
                    goalPrice: input.goalPrice,
                    currentSavings: nextInput.savings,
                    savedThisMonth: savedAmount,
                    plannedMonthly,
                    monthsRemainingBefore: result.goalMonthsToReach,
                    monthsRemainingAfter: nextResult.goalMonthsToReach,
                    mood: mood ?? undefined,
                    event,
                    eventAmount: eventAmount || undefined,
                  });

                  // Persist ground-truth (unscoped) analysis
                  setAnalysis(nextInput, nextResult);

                  // Compute the final distribution to apply to goals.
                  let finalDistributions: { goalId: string; amount: number }[] = [];
                  if (activeGoals.length === 0) {
                    finalDistributions = [];
                  } else if (activeGoals.length === 1) {
                    finalDistributions = [
                      { goalId: activeGoals[0].id, amount: savedAmount },
                    ];
                  } else {
                    finalDistributions = activeGoals
                      .map((g) => ({
                        goalId: g.id,
                        amount: Math.max(0, Math.round(distribution[g.id] ?? 0)),
                      }))
                      .reduce<{ goalId: string; amount: number }[]>((acc, d) => {
                        const already = acc.reduce((s, x) => s + x.amount, 0);
                        const room = Math.max(0, savedAmount - already);
                        acc.push({ goalId: d.goalId, amount: Math.min(room, d.amount) });
                        return acc;
                      }, []);
                  }

                  applyMonthlyDistribution(finalDistributions);

                  const allocationsForRecord: CheckinAllocation[] = finalDistributions
                    .filter((d) => d.amount > 0)
                    .map((d) => ({
                      goalId: d.goalId,
                      goalName:
                        activeGoals.find((g) => g.id === d.goalId)?.name ?? "هدف",
                      amount: d.amount,
                    }));

                  add({
                    savedThisMonth: savedAmount,
                    incomeChanged: event === "salary_up" || event === "salary_down",
                    newObligations: event === "new_commitments",
                    goalChanged: false,
                    feedback,
                    allocations: allocationsForRecord.length ? allocationsForRecord : undefined,
                  });

                  const newProgress =
                    input.goalPrice > 0
                      ? Math.min(
                          100,
                          Math.round((nextInput.savings / input.goalPrice) * 100)
                        )
                      : 0;

                  const months = nextResult.goalMonthsToReach;
                  const newEstimate =
                    Number.isFinite(months) && months < 999
                      ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
                      : "—";

                  const timelineDeltaMonths = Math.round(
                    result.goalMonthsToReach - nextResult.goalMonthsToReach
                  );

                  setSuccess({
                    feedback,
                    savedThisMonth: savedAmount,
                    newProgress,
                    newEstimate,
                    timelineDeltaMonths,
                    monthLabel,
                  });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "تعذّر حفظ التحديث الشهري.");
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={!canSubmit || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-bold text-white shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: BANK.accent }}
            >
              {submitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/70 border-b-transparent" />
              ) : (
                <ArrowUpRight className="h-5 w-5" />
              )}
              حفظ التحديث
            </button>
          </div>
        </section>
      )}

      {/* Recent updates timeline */}
      <section
        className="rounded-3xl p-6 shadow-card sm:p-7"
        style={{ backgroundColor: "#FFFFFF", border: `1px solid ${BANK.paperEdge}` }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: BANK.muted }}
            >
              السجل
            </p>
            <h3
              className="mt-1 text-lg font-bold sm:text-xl"
              style={{ color: BANK.ink }}
            >
              آخر التحديثات
            </h3>
          </div>
          {history.length > 3 && (
            <button
              onClick={() => setShowAllHistory((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-bold transition hover:opacity-80"
              style={{ color: BANK.inkAlt }}
            >
              {showAllHistory ? "إخفاء" : "عرض السجل الكامل"}
              <ChevronLeft className="h-3 w-3" />
            </button>
          )}
        </div>

        <RecentUpdatesTimeline history={history} showAll={showAllHistory} />
      </section>

      {submitting && <LoadingOverlay label="جاري تحديث خطتك..." />}
    </div>
  );
}

/* ================================================================== */
/* Premium page header                                                  */
/* ================================================================== */

function PremiumHeader() {
  const now = new Date();
  const label = `${AR_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl shadow-card"
          style={{ backgroundColor: BANK.inkAlt, color: "#FFFFFF" }}
          aria-hidden="true"
        >
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BANK.muted }}
          >
            التحديث الشهري
          </p>
          <h1
            className="mt-1 text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: BANK.ink }}
          >
            سجّل تقدمك لهذا الشهر
          </h1>
          <p className="mt-1.5 max-w-lg text-sm" style={{ color: BANK.muted }}>
            تحديث سريع يساعدنا على تحسين تحليلك وخطة الادخار.
          </p>
        </div>
      </div>
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
        style={{
          backgroundColor: "#FFFFFF",
          border: `1px solid ${BANK.paperEdge}`,
          color: BANK.ink,
        }}
      >
        <Clock3 className="h-3.5 w-3.5" style={{ color: BANK.muted }} />
        {label}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Monthly status card — horizontal summary                             */
/* ================================================================== */

interface MonthlyStatusCardProps {
  monthLabel: string;
  history: CheckinRecord[];
  currentKey: string;
  hasCurrentMonth: boolean;
  onOpenPlan: () => void;
}

function MonthlyStatusCard({
  monthLabel,
  history,
  currentKey,
  hasCurrentMonth,
  onOpenPlan,
}: MonthlyStatusCardProps) {
  const sorted = [...history].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  const latestForThisMonth = history.find((h) => h.monthKey === currentKey);
  const latestOverall = latestForThisMonth ?? sorted[0] ?? null;
  const latestLabel = latestOverall ? labelForMonthKey(latestOverall.monthKey) : null;

  const status = hasCurrentMonth
    ? { label: "مكتمل", tone: "ok" as const, note: latestForThisMonth ? `ادخرت ${formatSAR(latestForThisMonth.savedThisMonth)}` : "" }
    : { label: "قيد الإدخال", tone: "muted" as const, note: "سجّل ادخارك لهذا الشهر" };

  const statusStyle =
    status.tone === "ok"
      ? { bg: "#E4F1EC", color: "#0A5A42" }
      : { bg: `${BANK.paperEdge}`, color: BANK.muted };

  return (
    <section
      className="grid gap-4 rounded-3xl p-5 shadow-card sm:p-6 md:grid-cols-[1fr_auto] md:items-center md:gap-6"
      style={{ backgroundColor: BANK.paper, border: `1px solid ${BANK.paperEdge}` }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatusCell
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="آخر تحديث"
          value={latestLabel ?? "—"}
        />
        <StatusCell
          icon={<CalendarDays className="h-4 w-4" />}
          label="الشهر الحالي"
          value={monthLabel}
        />
        <div>
          <div
            className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BANK.muted }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            حالة التحديث
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: statusStyle.color }}
              />
              {status.label}
            </span>
            {status.note && (
              <span className="truncate text-[11px]" style={{ color: BANK.muted }}>
                {status.note}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenPlan}
        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5"
        style={{
          backgroundColor: "#FFFFFF",
          border: `1px solid ${BANK.paperEdge}`,
          color: BANK.ink,
        }}
      >
        عرض الخطة
        <ArrowUpRight className="h-4 w-4" />
      </button>
    </section>
  );
}

function StatusCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: BANK.muted }}
      >
        <span style={{ color: BANK.inkAlt }}>{icon}</span>
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-bold" style={{ color: BANK.ink }}>
        {value}
      </p>
    </div>
  );
}

/* ================================================================== */
/* Dynamic summary — restyled to bank palette                           */
/* ================================================================== */

interface DynamicSummaryProps {
  savedThisMonth: number;
  plannedMonthly: number;
  input: AnalysisInput;
  event: MonthlyEvent;
  eventAmount: number;
  effectiveMonths: number;
}

function DynamicSummary({
  savedThisMonth,
  plannedMonthly,
  input,
  event,
  eventAmount,
  effectiveMonths,
}: DynamicSummaryProps) {
  const gap = savedThisMonth - plannedMonthly;
  const isAhead = plannedMonthly > 0 && gap >= plannedMonthly * 0.15;
  const isBehind = plannedMonthly > 0 && gap <= -plannedMonthly * 0.15;

  const baselineMonths =
    plannedMonthly > 0
      ? Math.max(0, input.goalPrice - input.savings) / plannedMonthly
      : effectiveMonths;

  const rate = savedThisMonth > 0 ? savedThisMonth : plannedMonthly;
  const projectedMonths =
    rate > 0
      ? Math.max(0, input.goalPrice - input.savings - savedThisMonth) / rate
      : Infinity;

  const shift = Math.round(baselineMonths - projectedMonths);

  const lines: {
    icon: React.ReactNode;
    text: React.ReactNode;
    tone: "ok" | "warn" | "primary";
  }[] = [];

  lines.push({
    icon: <CheckCircle2 className="h-4 w-4" />,
    tone: "ok",
    text: (
      <>
        ادخرت <b>{formatSAR(savedThisMonth)}</b> هذا الشهر.
      </>
    ),
  });

  if (plannedMonthly > 0) {
    if (isAhead) {
      lines.push({
        icon: <Sparkles className="h-4 w-4" />,
        tone: "ok",
        text: (
          <>
            <b>{formatSAR(Math.abs(gap))}</b> فوق خطتك الشهرية. أحسنت.
          </>
        ),
      });
    } else if (isBehind) {
      lines.push({
        icon: <AlertTriangle className="h-4 w-4" />,
        tone: "warn",
        text: (
          <>
            <b>{formatSAR(Math.abs(gap))}</b> تحت خطتك الشهرية. الشهر القادم فرصة للتعويض.
          </>
        ),
      });
    }
  }

  if (shift > 0) {
    lines.push({
      icon: <Rocket className="h-4 w-4" />,
      tone: "ok",
      text: (
        <>
          موعد إنجاز الهدف تحسّن بحوالي <b>{shift} شهر</b>.
        </>
      ),
    });
  } else if (shift < 0) {
    lines.push({
      icon: <Clock3 className="h-4 w-4" />,
      tone: "warn",
      text: (
        <>
          موعد الإنجاز يتأخر بحوالي <b>{Math.abs(shift)} شهر</b>. لا تقلق — التعويض ممكن.
        </>
      ),
    });
  }

  if (event === "salary_up" && eventAmount > 0) {
    lines.push({
      icon: <Sparkles className="h-4 w-4" />,
      tone: "primary",
      text: (
        <>
          تم تحديث راتبك إلى <b>{formatSAR(eventAmount)}</b>.
        </>
      ),
    });
  } else if (event === "salary_down" && eventAmount > 0) {
    lines.push({
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: "warn",
      text: (
        <>
          تم تحديث راتبك إلى <b>{formatSAR(eventAmount)}</b>. سنعيد ضبط الخطة معك.
        </>
      ),
    });
  } else if (event === "new_commitments" && eventAmount > 0) {
    lines.push({
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: "warn",
      text: (
        <>
          أُضيف التزام شهري بقيمة <b>{formatSAR(eventAmount)}</b> إلى مصاريفك.
        </>
      ),
    });
  } else if (event === "loan_paid_off" && eventAmount > 0) {
    lines.push({
      icon: <Sparkles className="h-4 w-4" />,
      tone: "ok",
      text: (
        <>
          مبروك سداد قرض بقيمة <b>{formatSAR(eventAmount)}</b>.
        </>
      ),
    });
  } else if (event === "unexpected_expense" && eventAmount > 0) {
    lines.push({
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: "warn",
      text: (
        <>
          مصروف غير متوقع بقيمة <b>{formatSAR(eventAmount)}</b>. ادخارك هذا الشهر بعد هذا الأثر.
        </>
      ),
    });
  } else if (event === "bonus" && eventAmount > 0) {
    lines.push({
      icon: <Sparkles className="h-4 w-4" />,
      tone: "primary",
      text: (
        <>
          مبروك المكافأة! <b>{formatSAR(eventAmount)}</b> فرصة لدفعة قوية نحو الهدف.
        </>
      ),
    });
  } else if (event === "extra_income" && eventAmount > 0) {
    lines.push({
      icon: <Sparkles className="h-4 w-4" />,
      tone: "primary",
      text: (
        <>
          دخل إضافي <b>{formatSAR(eventAmount)}</b> — استثمره في تسريع الهدف.
        </>
      ),
    });
  }

  const toneStyle = (t: "ok" | "warn" | "primary") =>
    t === "ok"
      ? { color: "#0A5A42", bg: "#E4F1EC" }
      : t === "warn"
      ? { color: "#8A4A2F", bg: `${BANK.accent}22` }
      : { color: BANK.ai, bg: `${BANK.ai}18` };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-2xl p-5"
      style={{
        backgroundColor: BANK.paper,
        border: `1px solid ${BANK.paperEdge}`,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: BANK.ai }}
      >
        الأثر الفوري
      </p>
      <ul className="mt-3 space-y-2.5">
        {lines.map((l, i) => {
          const ts = toneStyle(l.tone);
          return (
            <li
              key={i}
              className="flex items-start gap-3 text-sm leading-relaxed"
              style={{ color: BANK.ink }}
            >
              <span
                className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: ts.bg, color: ts.color }}
              >
                {l.icon}
              </span>
              <span>{l.text}</span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}

/* ================================================================== */
/* Recent updates timeline                                              */
/* ================================================================== */

function RecentUpdatesTimeline({
  history,
  showAll,
}: {
  history: CheckinRecord[];
  showAll: boolean;
}) {
  const sorted = [...history].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  const items = showAll ? sorted : sorted.slice(0, 3);
  if (items.length === 0) {
    return (
      <p className="mt-4 text-xs" style={{ color: BANK.muted }}>
        لا توجد تحديثات بعد.
      </p>
    );
  }
  return (
    <ol className="relative mt-6 space-y-6 pr-6">
      {/* Vertical rail (RTL: right side) */}
      <span
        className="absolute right-2 top-1 bottom-1 w-px"
        style={{ backgroundColor: BANK.paperEdge }}
        aria-hidden="true"
      />
      {items.map((r) => (
        <li key={r.id} className="relative">
          {/* Dot */}
          <span
            className="absolute right-0 top-1.5 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full"
            style={{
              backgroundColor: "#E4F1EC",
              color: "#0A5A42",
              border: "2px solid #FFFFFF",
              boxShadow: `0 0 0 1px ${BANK.paperEdge}`,
            }}
            aria-hidden="true"
          >
            <CheckCircle2 className="h-3 w-3" />
          </span>
          <div className="flex flex-wrap items-baseline justify-between gap-2 pr-4">
            <div>
              <p className="text-sm font-bold" style={{ color: BANK.ink }}>
                {labelForMonthKey(r.monthKey)}
              </p>
              <p className="text-[11px]" style={{ color: BANK.muted }}>
                تم التحديث بنجاح
              </p>
            </div>
            <p
              className="text-sm font-bold tabular-nums"
              style={{ color: BANK.inkAlt }}
            >
              {formatSAR(r.savedThisMonth)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function labelForMonthKey(key: string) {
  const [y, m] = key.split("-").map((n) => Number(n));
  return `${AR_MONTHS[Math.max(0, Math.min(11, m - 1))]} ${y}`;
}

/* ================================================================== */
/* Success screen                                                       */
/* ================================================================== */

interface SuccessScreenData {
  feedback: CheckinFeedback;
  savedThisMonth: number;
  newProgress: number;
  newEstimate: string;
  timelineDeltaMonths: number;
  monthLabel: string;
}

function SuccessScreen({
  data,
  onOpenPlan,
  onDone,
}: {
  data: SuccessScreenData;
  onOpenPlan: () => void;
  onDone: () => void;
}) {
  const meta = STATUS_META[data.feedback.status];
  const shift = data.timelineDeltaMonths;
  const shiftLabel =
    shift > 0
      ? `تحسّن بـ ${shift} شهر`
      : shift < 0
      ? `تأخر بـ ${Math.abs(shift)} شهر`
      : "بدون تغيير";

  return (
    <div
      className="relative overflow-hidden rounded-[32px] p-8 shadow-elevated sm:p-10"
      style={{
        background: `linear-gradient(135deg, ${BANK.ink} 0%, ${BANK.inkAlt} 60%, #0A2C50 100%)`,
        color: "#F4F1EC",
      }}
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
      <div
        className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: `${BANK.accent}22` }}
      />

      <div className="relative">
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold"
          style={{
            backgroundColor: "rgba(184,219,203,0.22)",
            color: "#DFF5EC",
          }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {meta.label}
        </span>
        <h2
          className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
          style={{ color: "#FFFFFF" }}
        >
          تم إتمام تحديث {data.monthLabel}
        </h2>

        <dl className="mt-8 grid gap-3 sm:grid-cols-4">
          <SuccessStat label="أضفت" value={formatSAR(data.savedThisMonth)} />
          <SuccessStat label="التقدم الحالي" value={`${data.newProgress}%`} />
          <SuccessStat
            label="الإنجاز المتوقع"
            value={data.newEstimate === "—" ? "—" : formatDate(data.newEstimate)}
          />
          <SuccessStat label="الخط الزمني" value={shiftLabel} />
        </dl>

        <div
          className="mt-8 rounded-2xl p-4"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm font-semibold leading-relaxed" style={{ color: "#F4F1EC" }}>
            {data.feedback.headline}
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: "rgba(244,241,236,0.75)" }}
          >
            {data.feedback.recommendation}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenPlan}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-card transition hover:opacity-90"
            style={{ backgroundColor: BANK.accent }}
          >
            عرض خطة الادخار
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition hover:bg-white/10"
            style={{
              border: "1px solid rgba(244,241,236,0.25)",
              color: "#F4F1EC",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للتحليل المالي
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ backgroundColor: "rgba(244,241,236,0.08)" }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "rgba(244,241,236,0.6)" }}
      >
        {label}
      </p>
      <p className="mt-1 text-base font-bold" style={{ color: "#FFFFFF" }}>
        {value}
      </p>
    </div>
  );
}

/* ================================================================== */
/* Small total (distribution)                                           */
/* ================================================================== */

function SmallTotal({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ai" | "accent" | "muted";
}) {
  const color =
    tone === "ai"
      ? BANK.ai
      : tone === "accent"
      ? "#8A4A2F"
      : tone === "muted"
      ? BANK.muted
      : BANK.ink;
  return (
    <div
      className="rounded-lg p-2.5"
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BANK.paperEdge}`,
      }}
    >
      <p
        className="text-[9px] font-semibold uppercase tracking-widest"
        style={{ color: BANK.muted }}
      >
        {label}
      </p>
      <p className="mt-0.5 text-xs font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

// ---------- Event side effects on the analysis snapshot ----------

function applyEventToInput(
  input: AnalysisInput,
  event: MonthlyEvent,
  eventAmount: number,
  savedThisMonth: number
): AnalysisInput {
  let next: AnalysisInput = { ...input, savings: Math.max(0, input.savings + savedThisMonth) };
  const amt = Math.max(0, Number(eventAmount) || 0);

  switch (event) {
    case "salary_up":
    case "salary_down":
      if (amt > 0) next = { ...next, salary: amt };
      break;
    case "new_commitments":
      if (amt > 0) next = { ...next, expenses: input.expenses + amt };
      break;
    case "loan_paid_off":
      if (amt > 0) next = { ...next, debts: Math.max(0, input.debts - amt) };
      break;
    // bonus / extra_income / unexpected_expense / other / none: only savings changes (already applied).
  }

  return next;
}

/* ================================================================== */
/* AI Behavioral Review — After-Decision stage                          */
/* ================================================================== */

type BehaviorTrend = "improving" | "steady" | "declining";

type Level3 = "high" | "medium" | "low";
type SpendingStability = "more_stable" | "similar" | "less_stable";
type DecisionImpact = "improved" | "neutral" | "reassess";

interface BehaviorReview {
  summary: string;
  recommendation: string;
  trend: BehaviorTrend;
  trendLabel: string;
  confidenceLabel: "عالية" | "متوسطة" | "مقبولة";
  confidenceTone: "ok" | "primary" | "warn";
  // Stage-3 outputs — three behavioral insight cards + one tip.
  planAdherence: Level3;
  planAdherenceLabel: string;
  spendingStability: SpendingStability;
  spendingStabilityLabel: string;
  decisionImpact: DecisionImpact;
  decisionImpactLabel: string;
  nextMonthTip: string;
}

function buildBehaviorReview(params: {
  savedThisMonth: number;
  plannedMonthly: number;
  timelineDeltaMonths: number;
  history: CheckinRecord[];
  event: MonthlyEvent;
  financialStability: number;
  status: CheckinStatus;
}): BehaviorReview {
  const {
    savedThisMonth,
    plannedMonthly,
    timelineDeltaMonths,
    history,
    event,
    financialStability,
    status,
  } = params;

  // Previous months (exclude the record just added for this month, if present).
  const sorted = [...history].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  const prior = sorted.slice(0, -1); // everything before the current one
  const priorAvg =
    prior.length > 0
      ? prior.reduce((s, r) => s + Math.max(0, r.savedThisMonth), 0) / prior.length
      : 0;

  // Plan adherence — actual vs planned monthly target.
  const gap = plannedMonthly > 0 ? savedThisMonth - plannedMonthly : 0;
  const overPlan = plannedMonthly > 0 && gap >= plannedMonthly * 0.15;
  const underPlan = plannedMonthly > 0 && gap <= -plannedMonthly * 0.15;

  // Pattern vs previous months.
  const patternUp = prior.length > 0 && savedThisMonth >= priorAvg * 1.1;
  const patternDown = prior.length > 0 && savedThisMonth <= priorAvg * 0.85;

  // Trend — combines timeline shift + pattern change + plan adherence.
  let trend: BehaviorTrend;
  if (
    (timelineDeltaMonths > 0 || overPlan || patternUp) &&
    !underPlan &&
    !patternDown
  ) {
    trend = "improving";
  } else if (underPlan || patternDown || timelineDeltaMonths < 0) {
    trend = "declining";
  } else {
    trend = "steady";
  }

  const trendLabel =
    trend === "improving"
      ? "تحسّن مقارنة بالأشهر السابقة"
      : trend === "declining"
      ? "تراجع مقارنة بالأشهر السابقة"
      : "ثبات مقارنة بالأشهر السابقة";

  // Confidence — how much data + how consistent the signals are.
  const dataDepth = Math.min(3, prior.length); // 0..3
  const signalAlignment =
    (trend === "improving" && status === "ahead") ||
    (trend === "declining" && status === "behind") ||
    (trend === "steady" && status === "on_track")
      ? 1
      : 0;
  const stabilityHigh = financialStability >= 60 ? 1 : 0;
  const confidenceScore = dataDepth + signalAlignment + stabilityHigh;

  let confidenceLabel: BehaviorReview["confidenceLabel"];
  let confidenceTone: BehaviorReview["confidenceTone"];
  if (confidenceScore >= 4) {
    confidenceLabel = "عالية";
    confidenceTone = "ok";
  } else if (confidenceScore >= 2) {
    confidenceLabel = "متوسطة";
    confidenceTone = "primary";
  } else {
    confidenceLabel = "مقبولة";
    confidenceTone = "warn";
  }

  // Narrative summary — no numbers, focuses on behavior.
  let summary: string;
  if (savedThisMonth <= 0) {
    summary =
      "لم يُسجَّل ادخار هذا الشهر. إن استمر هذا النمط، قد يتأخر إنجاز هدفك المالي. حاول تخصيص جزء بسيط في الشهر القادم لتحافظ على مسار الخطة.";
  } else if (trend === "improving" && overPlan) {
    summary =
      "التزمت بخطتك الشهرية وتجاوزتها هذا الشهر، وحافظت على استقرار مالي جيد. الاستمرار على هذا النمط سيسرّع تحقيق هدفك المالي.";
  } else if (trend === "improving") {
    summary =
      "أظهرت هذا الشهر تحسّناً واضحاً مقارنة بالأشهر السابقة. الحفاظ على هذا الاتجاه سيدعم تقدّمك نحو الهدف بشكل مستقر.";
  } else if (trend === "steady" && !underPlan) {
    summary =
      "حافظت على خطتك الشهرية بثبات هذا الشهر دون تراجع ملحوظ. الاستمرار بهذا الالتزام يبقي مسارك المالي متوازناً.";
  } else if (event === "unexpected_expense") {
    summary =
      "مصروف غير متوقع هذا الشهر خفّض من ادخارك مقارنة بخطتك. إن كان طارئاً فلا داعي للقلق؛ عدّل خطتك القادمة للتعويض تدريجياً.";
  } else if (event === "new_commitments") {
    summary =
      "إضافة التزامات جديدة هذا الشهر أثّرت على قدرتك على الادخار. مراجعة الالتزامات وأولوياتك ستعيد التوازن لخطتك.";
  } else if (trend === "declining" && underPlan) {
    summary =
      "أقل من الخطة الشهرية هذا الشهر، ومقارنة بالأشهر السابقة يظهر تراجع في الادخار. إن استمر هذا النمط، قد يتأخر إنجاز الهدف المالي.";
  } else {
    summary =
      "الادخار هذا الشهر انخفض عن مستواه المعتاد. تعديل بسيط في الشهر القادم يكفي لإعادة الخطة إلى مسارها.";
  }

  // Short single-sentence recommendation.
  let recommendation: string;
  if (trend === "improving" && overPlan) {
    recommendation =
      "احتفظ بجزء من الفائض في صندوق الطوارئ لدعم استقرارك خلال الأشهر القادمة.";
  } else if (trend === "improving") {
    recommendation =
      "استمر على نفس الالتزام الشهري، وسنراقب معك التقدّم في التحديث القادم.";
  } else if (trend === "steady") {
    recommendation =
      "الحفاظ على هذا الإيقاع كافٍ الآن؛ مراجعة المصروفات القابلة للتقليل قد ترفع الادخار مستقبلاً.";
  } else if (event === "unexpected_expense") {
    recommendation =
      "ضع مبلغاً بسيطاً إضافياً في الأشهر القادمة لتعويض هذا المصروف الطارئ.";
  } else if (event === "new_commitments") {
    recommendation =
      "راجع الالتزامات الجديدة وتحقّق من إمكانية تأجيل أو تخفيض غير الأساسية منها.";
  } else if (underPlan) {
    recommendation =
      "خفّض أكبر مصروف قابل للتقليل هذا الشهر لتعوّض الفرق قبل التحديث القادم.";
  } else {
    recommendation =
      "حاول تخصيص مبلغ ثابت في بداية الشهر القادم قبل أي مصروف اختياري.";
  }

  // ---------- Stage 3 behavioral insight cards ----------

  // Plan adherence — how well the actual amount matched the planned monthly.
  let planAdherence: Level3;
  if (plannedMonthly <= 0) {
    planAdherence = savedThisMonth > 0 ? "medium" : "low";
  } else {
    const ratio = savedThisMonth / plannedMonthly;
    if (ratio >= 0.9) planAdherence = "high";
    else if (ratio >= 0.6) planAdherence = "medium";
    else planAdherence = "low";
  }
  const planAdherenceLabel =
    planAdherence === "high"
      ? "مرتفع"
      : planAdherence === "medium"
      ? "متوسط"
      : "منخفض";

  // Spending stability — inferred from event + trend + prior savings variance.
  let spendingStability: SpendingStability;
  const priorVariance = (() => {
    if (prior.length < 2) return 0;
    const values = prior.map((r) => Math.max(0, r.savedThisMonth));
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    if (mean <= 0) return 0;
    const variance =
      values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean; // coefficient of variation
  })();
  if (event === "unexpected_expense" || event === "new_commitments") {
    spendingStability = "less_stable";
  } else if (event === "loan_paid_off" || event === "bonus" || event === "extra_income") {
    spendingStability = "more_stable";
  } else if (trend === "declining" && priorVariance > 0.3) {
    spendingStability = "less_stable";
  } else if (
    trend === "improving" &&
    prior.length >= 2 &&
    priorVariance < 0.2
  ) {
    spendingStability = "more_stable";
  } else {
    spendingStability = "similar";
  }
  const spendingStabilityLabel =
    spendingStability === "more_stable"
      ? "أكثر استقراراً"
      : spendingStability === "less_stable"
      ? "أقل استقراراً"
      : "قريب من الشهور السابقة";

  // Decision impact — effect of this month's decision on your stability trajectory.
  let decisionImpact: DecisionImpact;
  if (
    trend === "improving" &&
    (planAdherence === "high" || planAdherence === "medium") &&
    spendingStability !== "less_stable"
  ) {
    decisionImpact = "improved";
  } else if (
    trend === "declining" ||
    spendingStability === "less_stable" ||
    planAdherence === "low"
  ) {
    decisionImpact = "reassess";
  } else {
    decisionImpact = "neutral";
  }
  const decisionImpactLabel =
    decisionImpact === "improved"
      ? "تحسّن استقرارك المالي."
      : decisionImpact === "reassess"
      ? "يحتاج القرار إلى إعادة تقييم."
      : "لم يؤثر القرار على استقرارك.";

  // Next-month tip — one short, specific action.
  let nextMonthTip: string;
  if (planAdherence === "low" && spendingStability === "less_stable") {
    nextMonthTip = "حاول تقليل الإنفاق الترفيهي هذا الشهر لتستعيد التوازن.";
  } else if (planAdherence === "high" && trend === "improving") {
    nextMonthTip = "زد الادخار بنسبة 10% للاستفادة من هذا الزخم.";
  } else if (spendingStability === "less_stable") {
    nextMonthTip = "ابدأ ببناء صندوق الطوارئ لتقليل أثر المفاجآت الشهرية.";
  } else if (planAdherence === "high") {
    nextMonthTip = "استمر بنفس خطة الادخار — أنت على المسار الصحيح.";
  } else if (event === "unexpected_expense") {
    nextMonthTip = "ضع مبلغاً بسيطاً إضافياً هذا الشهر لتعويض المصروف الطارئ.";
  } else {
    nextMonthTip = "خصّص مبلغ الادخار في بداية الشهر قبل أي مصروف اختياري.";
  }

  return {
    summary,
    recommendation,
    trend,
    trendLabel,
    confidenceLabel,
    confidenceTone,
    planAdherence,
    planAdherenceLabel,
    spendingStability,
    spendingStabilityLabel,
    decisionImpact,
    decisionImpactLabel,
    nextMonthTip,
  };
}

interface AIBehavioralReviewCardProps {
  savedThisMonth: number;
  plannedMonthly: number;
  timelineDeltaMonths: number;
  history: CheckinRecord[];
  event: MonthlyEvent;
  financialStability: number;
  status: CheckinStatus;
}

function AIBehavioralReviewCard(props: AIBehavioralReviewCardProps) {
  const review = buildBehaviorReview(props);

  const trendStyle =
    review.trend === "improving"
      ? {
          bg: "#E4F1EC",
          color: "#0A5A42",
          icon: <TrendingUp className="h-3.5 w-3.5" />,
        }
      : review.trend === "declining"
      ? {
          bg: "#FBEDE5",
          color: "#8A4A2F",
          icon: <TrendingDown className="h-3.5 w-3.5" />,
        }
      : {
          bg: "rgba(0,33,52,0.06)",
          color: BANK.inkAlt,
          icon: <Minus className="h-3.5 w-3.5" />,
        };

  const confidenceStyle =
    review.confidenceTone === "ok"
      ? { bg: "#E4F1EC", color: "#0A5A42" }
      : review.confidenceTone === "primary"
      ? { bg: "rgba(131,127,216,0.16)", color: BANK.ai }
      : { bg: "#FBEDE5", color: "#8A4A2F" };

  return (
    <section
      className="rounded-3xl p-6 shadow-card sm:p-8"
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BANK.paperEdge}`,
      }}
    >
      {/* Top row — AI icon + title/subtitle + confidence pill */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${BANK.ai}18`, color: BANK.ai }}
            aria-hidden="true"
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: BANK.ai }}
              >
                المرحلة الثالثة · بعد القرار
              </p>
            </div>
            <h3
              className="mt-1 text-lg font-bold sm:text-xl"
              style={{ color: BANK.ink }}
            >
              تحليل سلوكك المالي
            </h3>
            <p
              className="mt-1 max-w-xl text-xs leading-relaxed sm:text-sm"
              style={{ color: BANK.muted }}
            >
              يقارن الذكاء الاصطناعي نتائج هذا الشهر بالأشهر السابقة لتوضيح أثر
              قراراتك المالية واقتراح تحسينات عملية.
            </p>
          </div>
        </div>

        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold leading-none"
          style={{
            backgroundColor: confidenceStyle.bg,
            color: confidenceStyle.color,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: confidenceStyle.color }}
          />
          الثقة: {review.confidenceLabel}
        </span>
      </div>

      {/* Personalized behavioral summary */}
      <p
        className="mt-6 max-w-3xl text-sm leading-loose sm:text-base"
        style={{ color: BANK.muted }}
      >
        {review.summary}
      </p>

      {/* Trend pill — kept as a subtle context marker under the summary */}
      <div
        className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
        style={{ backgroundColor: trendStyle.bg, color: trendStyle.color }}
      >
        {trendStyle.icon}
        {review.trendLabel}
      </div>

      {/* Three behavioral insight cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <InsightCard
          icon={<TrendingUp className="h-4 w-4" />}
          iconBg="rgba(0,33,52,0.06)"
          iconColor={BANK.inkAlt}
          eyebrow="الالتزام بخطة الادخار"
          badge={review.planAdherenceLabel}
          badgeStyle={levelBadgeStyle(review.planAdherence)}
        />
        <InsightCard
          icon={<CreditCard className="h-4 w-4" />}
          iconBg="rgba(213,141,121,0.14)"
          iconColor={BANK.accent}
          eyebrow="استقرار الإنفاق"
          badge={review.spendingStabilityLabel}
          badgeStyle={spendingBadgeStyle(review.spendingStability)}
        />
        <InsightCard
          icon={<Target className="h-4 w-4" />}
          iconBg="rgba(131,127,216,0.14)"
          iconColor={BANK.ai}
          eyebrow="أثر القرار المالي"
          body={review.decisionImpactLabel}
          bodyTone={decisionImpactTone(review.decisionImpact)}
        />
      </div>

      {/* Next-month recommendation */}
      <div
        className="mt-5 flex items-start gap-3 rounded-2xl p-4"
        style={{
          backgroundColor: BANK.paper,
          border: `1px solid ${BANK.paperEdge}`,
        }}
      >
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${BANK.accent}18`,
            color: BANK.accent,
          }}
          aria-hidden="true"
        >
          <Lightbulb className="h-4 w-4" />
        </span>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BANK.accent }}
          >
            توصية الشهر القادم
          </p>
          <p
            className="mt-1 text-sm font-semibold leading-relaxed"
            style={{ color: BANK.ink }}
          >
            {review.nextMonthTip}
          </p>
        </div>
      </div>
    </section>
  );
}

/* Small helper — one insight card (icon + eyebrow + badge or body) */
function InsightCard({
  icon,
  iconBg,
  iconColor,
  eyebrow,
  badge,
  badgeStyle,
  body,
  bodyTone,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  eyebrow: string;
  badge?: string;
  badgeStyle?: { bg: string; color: string };
  body?: string;
  bodyTone?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BANK.paperEdge}`,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg, color: iconColor }}
          aria-hidden="true"
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
          {badge && badgeStyle ? (
            <span
              className="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold leading-none"
              style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
            >
              {badge}
            </span>
          ) : (
            <p
              className="mt-1.5 text-sm font-semibold leading-relaxed"
              style={{ color: bodyTone ?? BANK.ink }}
            >
              {body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function levelBadgeStyle(level: Level3): { bg: string; color: string } {
  if (level === "high") return { bg: "#E4F1EC", color: "#0A5A42" };
  if (level === "medium")
    return { bg: "rgba(131,127,216,0.16)", color: BANK.ai };
  return { bg: "#FBEDE5", color: "#8A4A2F" };
}

function spendingBadgeStyle(
  s: SpendingStability
): { bg: string; color: string } {
  if (s === "more_stable") return { bg: "#E4F1EC", color: "#0A5A42" };
  if (s === "less_stable") return { bg: "#FBEDE5", color: "#8A4A2F" };
  return { bg: "rgba(0,33,52,0.06)", color: BANK.inkAlt };
}

function decisionImpactTone(d: DecisionImpact): string {
  if (d === "improved") return "#0A5A42";
  if (d === "reassess") return "#8A4A2F";
  return BANK.inkAlt;
}

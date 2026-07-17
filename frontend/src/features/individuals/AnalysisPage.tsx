import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  Wallet,
  BarChart2,
  ArrowLeft,
  ArrowUpRight,
  Coins,
  CreditCard,
  PiggyBank,
  UtensilsCrossed,
  Sparkles,
  Target,
  Timer,
  ShieldCheck,
  TrendingUp,
  Info,
  Pencil,
  CalendarClock,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader";
import { Card, CardHeader } from "../../components/shared/Card";
import { Input } from "../../components/shared/Input";
import { Button } from "../../components/shared/Button";
import { LoadingOverlay } from "../../components/shared/LoadingOverlay";
import { useCheckin } from "../checkin/checkinStore";
import { api } from "../../lib/api";
import { AnalysisInput, AnalysisResult } from "../../types";
import { useAnalysis } from "../analysis/analysisStore";
import { useAuth } from "../auth/authStore";
import { cn, formatPercent, formatSAR } from "../../lib/format";

/* ------------------------------------------------------------------ */
/* Bank palette (Financial Analysis only)                              */
/* ------------------------------------------------------------------ */

const BANK = {
  paper:    "#fcf8f5",  // page/card background
  ink:      "#02151e",  // main dark ink
  inkAlt:   "#002134",  // primary deep navy
  muted:    "#3f3c3e",  // secondary text
  accent:   "#d58d79",  // coral accent (buttons, attention)
  ai:       "#837fd8",  // AI purple accent
  paperEdge:"#EDE7DE",  // subtle divider on paper
} as const;

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function monthLabelFromKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  return `${AR_MONTHS[Math.max(0, Math.min(11, m - 1))]} ${y}`;
}

function daysWord(n: number): string {
  if (n <= 0) return "";
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومين";
  if (n >= 3 && n <= 10) return `${n} أيام`;
  return `${n} يوماً`;
}

// Readiness tier
type Tier = "poor" | "fair" | "good";
const tierOfReadiness = (v: number): Tier => (v <= 40 ? "poor" : v <= 70 ? "fair" : "good");
const READINESS_TIER: Record<
  Tier,
  { label: string; note: string; ringColor: string; pillBg: string; pillText: string }
> = {
  poor: {
    label: "بحاجة إلى تحسين",
    note: "يعكس هذا المؤشر مدى قدرتك الحالية على الادخار وتحقيق أهدافك المالية.",
    ringColor: BANK.accent,
    pillBg: "rgba(213,141,121,0.22)",
    pillText: "#F6D5C6",
  },
  fair: {
    label: "جيد",
    note: "يعكس هذا المؤشر مدى قدرتك الحالية على الادخار وتحقيق أهدافك المالية.",
    ringColor: BANK.ai,
    pillBg: "rgba(131,127,216,0.22)",
    pillText: "#E7E5F8",
  },
  good: {
    label: "ممتاز",
    note: "يعكس هذا المؤشر مدى قدرتك الحالية على الادخار وتحقيق أهدافك المالية.",
    ringColor: "#D58D79 ",
    pillBg: "rgba(184,219,203,0.22)",
    pillText: "#DFF5EC",
  },
};

interface FormValues extends AnalysisInput {}

export function AnalysisPage() {
  const { user } = useAuth();
  const { input: prevInput, result, hasAnalysis, setAnalysis } = useAnalysis();
  const { monthlyStatus, history: checkins } = useCheckin();
  const navigate = useNavigate();
  const salaryDefault = user?.monthlySalary ?? prevInput?.salary ?? 0;
  const savingsDefault = user?.optionalSavings ?? prevInput?.savings ?? 0;

  // Latest check-in label for the Monthly Update card
  const latestCheckinLabel = useMemo(() => {
    const sorted = [...checkins].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    const last = sorted[sorted.length - 1];
    return last ? monthLabelFromKey(last.monthKey) : null;
  }, [checkins]);

  const [editing, setEditing] = useState(!hasAnalysis);

  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      salary: prevInput?.salary || salaryDefault,
      expenses: prevInput?.expenses || 0,
      debts: prevInput?.debts || 0,
      savings: prevInput?.savings || savingsDefault,
      restaurants: prevInput?.restaurants || 0,
      entertainment: prevInput?.entertainment || 0,
      goal: prevInput?.goal || "شراء منزل",
      goalPrice: prevInput?.goalPrice || 300000,
      targetMonths: prevInput?.targetMonths || 36,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    setLoading(true);
    try {
      const numeric: AnalysisInput = {
        salary: Number(data.salary),
        expenses: Number(data.expenses),
        debts: Number(data.debts),
        savings: Number(data.savings),
        restaurants: Number(data.restaurants),
        entertainment: Number(data.entertainment),
        goal: data.goal,
        goalPrice: Number(data.goalPrice),
        targetMonths: Number(data.targetMonths),
      };
      const { data: r } = await api.post<AnalysisResult>("/analysis", numeric);
      setAnalysis(numeric, r);
      setEditing(false);
      navigate("/app/financial-analysis");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إتمام التحليل.");
    } finally {
      setLoading(false);
    }
  });

  // --- Details view (only when analysis exists and user isn't editing) ---
  if (hasAnalysis && result && prevInput && !editing) {
    const stabilityTone = toneFromPct(result.financialStability, true);
    const dtiTone = toneFromPct(result.debtRatio, false);
    const efTone = toneFromPct(result.emergencyFund, true);
    const leakageTone: Tone =
      result.financialLeakage <= 0
        ? "ok"
        : result.financialLeakage < prevInput.salary * 0.08
        ? "primary"
        : result.financialLeakage < prevInput.salary * 0.15
        ? "warn"
        : "danger";

    // Build one executive-summary sentence (no bullet list)
    const executiveSummary = buildExecutiveSummary({
      stability: stabilityTone,
      dti: dtiTone,
      ef: efTone,
      leakage: leakageTone,
    });

    // Smart recommendation body (from real tones — no goal names)
    const smartRec = buildSmartRecommendation({
      readiness: result.readinessScore,
      dti: dtiTone,
      ef: efTone,
      leakage: leakageTone,
    });

    // Before-Financing AI insight (short professional narrative + confidence)
    const readinessInsight = buildReadinessInsight({
      readiness: result.readinessScore,
      stability: stabilityTone,
      dti: dtiTone,
      ef: efTone,
      leakage: leakageTone,
    });

    return (
      <div className="mx-auto max-w-5xl space-y-8">
        {/* ================================================ */}
        {/* 1) HEADER                                          */}
        {/* ================================================ */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: BANK.muted }}
            >
              التحليل المالي
            </p>
            <h1
              className="mt-1 text-2xl font-bold tracking-tight md:text-3xl"
              style={{ color: BANK.ink }}
            >
              تقريرك المالي
            </h1>
            <p className="mt-1.5 max-w-lg text-sm" style={{ color: BANK.muted }}>
              أربعة مؤشرات كافية لفهم وضعك المالي.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
            style={{
              border: `1px solid ${BANK.paperEdge}`,
              backgroundColor: "#FFFFFF",
              color: BANK.ink,
            }}
          >
            <Pencil className="h-4 w-4" />
            تحديث البيانات
          </button>
        </div>

        {/* ================================================ */}
        {/* 2) FINANCIAL READINESS HERO                        */}
        {/* ================================================ */}
        <ReadinessHero score={result.readinessScore} insight={readinessInsight} />

        {/* ================================================ */}
        {/* 3) FOUR FINANCIAL INDICATORS                       */}
        {/* ================================================ */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <IndicatorCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="الاستقرار المالي"
            value={formatPercent(result.financialStability)}
            progress={result.financialStability}
            tone={stabilityTone}
            explanation="دخلك الشهري مستقر."
            fallbackExplanations={{
              warn: "دخلك يحتاج ثباتاً أكبر.",
              danger: "دخلك غير منتظم.",
            }}
          />

          <IndicatorCard
            icon={<CreditCard className="h-5 w-5" />}
            label="نسبة الالتزامات (DTI)"
            value={formatPercent(result.debtRatio)}
            progress={result.debtRatio}
            tone={dtiTone}
            explanation="التزاماتك ضمن الحدود الآمنة."
            fallbackExplanations={{
              warn: "التزاماتك مرتفعة قليلاً.",
              danger: "التزاماتك تحتاج للخفض.",
            }}
          />

          <IndicatorCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="صندوق الطوارئ"
            value={formatPercent(result.emergencyFund)}
            progress={result.emergencyFund}
            tone={efTone}
            explanation="مدخراتك تغطي أي طارئ."
            fallbackExplanations={{
              warn: "احتياطك يغطي بضعة أشهر فقط.",
              danger: "لا يوجد احتياطي كافٍ.",
            }}
          />

          <IndicatorCard
            icon={<UtensilsCrossed className="h-5 w-5" />}
            label="المصروفات القابلة للتقليل"
            value={`${formatSAR(result.financialLeakage)} / شهر`}
            tone={leakageTone}
            explanation="مصروفاتك متوازنة — لا يوجد ما يمكن تقليله دون التأثير على احتياجاتك الأساسية."
            fallbackExplanations={{
              warn: "يمكن تقليل جزء من هذه المصروفات دون التأثير على احتياجاتك الأساسية، مما يزيد قدرتك على الادخار.",
              danger: "يمكن تقليل جزء من هذه المصروفات دون التأثير على احتياجاتك الأساسية، مما يزيد قدرتك على الادخار.",
            }}
            statusOverride={
              leakageTone === "warn" || leakageTone === "danger"
                ? "يمكن تحسينها"
                : undefined
            }
          />
        </section>

        {/* ================================================ */}
        {/* 4) EXECUTIVE INSIGHTS — one paragraph              */}
        {/* ================================================ */}
        <InsightsCard summary={executiveSummary} />

        {/* ================================================ */}
        {/* 5) MONTHLY UPDATE (compact)                        */}
        {/* ================================================ */}
        <MonthlyUpdateCompact
          state={monthlyStatus.state}
          daysDisplay={monthlyStatus.daysDisplay}
          nextInDays={monthlyStatus.nextInDays}
          completedMonthLabel={monthlyStatus.completedMonthLabel}
          latestLabel={latestCheckinLabel}
        />

        {/* ================================================ */}
        {/* 6) SMART RECOMMENDATION (premium dark card)        */}
        {/* ================================================ */}
        <SmartRecommendationHero body={smartRec} />
      </div>
    );
  }

  // --- Form view ---
  return (
    <div>
      <PageHeader
        eyebrow="التحليل المالي"
        title="نموذج تحليل الجاهزية المالية"
        description="أدخل بياناتك المالية لبناء تقرير احترافي وخطة عمل شخصية."
        icon={<BarChart2 className="h-5 w-5" />}
        actions={
          hasAnalysis && (
            <Button variant="outline" onClick={() => setEditing(false)} icon={<ArrowLeft className="h-4 w-4" />}>
              عرض التقرير
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card padded>
            <CardHeader
              title="بيانات مالية أساسية"
              subtitle="الدخل والمصاريف والالتزامات"
              icon={<Wallet className="h-4 w-4" />}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="الراتب الشهري"
                type="number"
                icon={<Coins className="h-4 w-4" />}
                suffix="ر.س"
                {...register("salary", { required: true, valueAsNumber: true })}
              />
              <Input
                label="المصاريف الشهرية"
                type="number"
                icon={<Wallet className="h-4 w-4" />}
                suffix="ر.س"
                {...register("expenses", { required: true, valueAsNumber: true })}
              />
              <Input
                label="إجمالي الديون"
                type="number"
                icon={<CreditCard className="h-4 w-4" />}
                suffix="ر.س"
                {...register("debts", { valueAsNumber: true })}
              />
              <Input
                label="مصاريف المطاعم شهرياً"
                type="number"
                icon={<UtensilsCrossed className="h-4 w-4" />}
                suffix="ر.س"
                {...register("restaurants", { valueAsNumber: true })}
              />
              <Input
                label="مصاريف الترفيه شهرياً"
                type="number"
                icon={<Sparkles className="h-4 w-4" />}
                suffix="ر.س"
                {...register("entertainment", { valueAsNumber: true })}
              />
              <Input
                label="إجمالي المدخرات الحالية"
                type="number"
                icon={<PiggyBank className="h-4 w-4" />}
                suffix="ر.س"
                {...register("savings", { valueAsNumber: true })}
              />
            </div>

            <div className="divider my-6" />

            <CardHeader
              title="هدفك المالي"
              subtitle="نستخدمه لبناء خطة الادخار"
              icon={<Target className="h-4 w-4" />}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Input
                  label="الهدف"
                  icon={<Target className="h-4 w-4" />}
                  placeholder="شراء منزل، سيارة، رحلة عائلية..."
                  {...register("goal", { required: true })}
                />
              </div>
              <Input
                label="التكلفة"
                type="number"
                icon={<Coins className="h-4 w-4" />}
                suffix="ر.س"
                {...register("goalPrice", { valueAsNumber: true })}
              />
              <div className="sm:col-span-3">
                <Input
                  label="عدد الأشهر المستهدفة لتحقيق الهدف"
                  type="number"
                  icon={<Timer className="h-4 w-4" />}
                  suffix="شهر"
                  {...register("targetMonths", { valueAsNumber: true })}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-danger/30 bg-danger-light p-3 text-xs text-danger-dark">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-ink-mute">
                جميع المؤشرات التفصيلية ستظهر هنا بعد اكتمال التحليل.
              </p>
              <Button
                type="submit"
                loading={loading || formState.isSubmitting}
                icon={<ArrowLeft className="h-4 w-4" />}
              >
                تحليل ذكي
              </Button>
            </div>
          </Card>
        </motion.form>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="ماذا سنحلل؟"
              subtitle="مؤشرات دقيقة"
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <ul className="space-y-2 text-sm text-ink-soft">
              {[
                "درجة الجاهزية المالية",
                "الاستقرار المالي",
                "نسبة الالتزامات (DTI)",
                "القدرة على السداد",
                "اتساق الدخل",
                "كفاءة الميزانية",
                "صندوق الطوارئ",
                "احتمالية بلوغ الهدف",
                "المصروفات القابلة للتقليل",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="نصائح لتحليل دقيق" icon={<Info className="h-4 w-4" />} />
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>• أدخل قيماً واقعية للحصول على توصيات مفيدة.</li>
              <li>• لا تنسَ المصاريف اليومية والمتكررة.</li>
              <li>• حدّد هدفاً واضحاً قابلاً للقياس زمنياً.</li>
            </ul>
          </Card>
        </div>
      </div>

      {loading && <LoadingOverlay label="جاري التحليل بواسطة الذكاء الاصطناعي..." />}
    </div>
  );
}

/* ================================================================== */
/* Tones                                                                */
/* ================================================================== */

type Tone = "ok" | "primary" | "warn" | "danger";

function toneFromPct(v: number, higherIsBetter: boolean): Tone {
  if (higherIsBetter) {
    if (v >= 70) return "ok";
    if (v >= 40) return "warn";
    return "danger";
  }
  if (v <= 30) return "ok";
  if (v <= 60) return "warn";
  return "danger";
}

// Tone → refined chip + pastel icon bg + progress bar accent.
// Shared by every indicator card so all four feel like ONE component.
const TONE_STYLES: Record<
  Tone,
  {
    text: string;
    bar: string;
    chipBg: string;
    chipText: string;
    statusLabel: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  ok: {
    text: BANK.inkAlt,
    bar: "#3CB371",
    chipBg: "#E4F1EC",
    chipText: "#0A5A42",
    statusLabel: "ممتاز",
    iconBg: "#E4F1EC",
    iconColor: "#0A5A42",
  },
  primary: {
    text: BANK.inkAlt,
    bar: BANK.inkAlt,
    chipBg: "#EAF1F6",
    chipText: BANK.inkAlt,
    statusLabel: "جيد",
    iconBg: "#EAF1F6",
    iconColor: BANK.inkAlt,
  },
  warn: {
    text: "#8A4A2F",
    bar: BANK.accent,
    chipBg: "#FBEDE5",
    chipText: "#8A4A2F",
    statusLabel: "مقبول",
    iconBg: "#FBEDE5",
    iconColor: "#8A4A2F",
  },
  danger: {
    text: "#8A2F2A",
    bar: "#B3413A",
    chipBg: "#FBE9E7",
    chipText: "#8A2F2A",
    statusLabel: "يحتاج انتباه",
    iconBg: "#FBE9E7",
    iconColor: "#8A2F2A",
  },
};

// Synthetic progress used only for the visual 4px track when a card
// exposes no percentage of its own (e.g. currency-value leakage card).
// This keeps the bar visible on every card without altering any number.
const TONE_SYNTHETIC_PROGRESS: Record<Tone, number> = {
  ok: 20,
  primary: 45,
  warn: 65,
  danger: 88,
};

/* ================================================================== */
/* 2) Financial Readiness Hero — premium dark gradient card             */
/* ================================================================== */

function ReadinessHero({
  score,
  insight,
}: {
  score: number;
  insight: ReadinessInsight;
}) {
  const tier = tierOfReadiness(score);
  const meta = READINESS_TIER[tier];
  const size = 200;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);

  return (
    <section
      className="relative overflow-hidden rounded-[32px] p-8 shadow-elevated sm:p-10"
      style={{
        background: `linear-gradient(135deg, ${BANK.ink} 0%, ${BANK.inkAlt} 60%, #0A2C50 100%)`,
        color: "#F4F1EC",
      }}
    >
      {/* Decorative elegant lines */}
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
        style={{ backgroundColor: `${meta.ringColor}22` }}
      />

      <div className="relative grid gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-12">
        {/* Right side (RTL: first in DOM) — Ring */}
        <div
          className="mx-auto flex flex-col items-center gap-4 md:mx-0 md:pt-2"
          style={{ width: size }}
        >
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={stroke}
                stroke="rgba(244,241,236,0.12)"
                fill="transparent"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={stroke}
                stroke={meta.ringColor}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-5xl font-bold leading-none tabular-nums"
                style={{ color: "#FFFFFF" }}
              >
                {Math.round(clamped)}
                <span
                  className="text-xl font-semibold"
                  style={{ color: "rgba(244,241,236,0.6)" }}
                >
                  %
                </span>
              </span>
              <span
                className="mt-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "rgba(244,241,236,0.55)" }}
              >
                الجاهزية
              </span>
            </div>
          </div>
          {/* Status badge just below the ring */}
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold"
            style={{ backgroundColor: meta.pillBg, color: meta.pillText }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: meta.ringColor }}
            />
            {meta.label}
          </span>
        </div>

        {/* Left side — Title + description + embedded AI panel + CTA */}
        <div className="flex flex-col items-start gap-5">
          <div>
            <h2
              className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
              style={{ color: "#FFFFFF" }}
            >
              جاهزيتك المالية
            </h2>
            <p
              className="mt-3 max-w-xl text-sm leading-relaxed sm:text-base"
              style={{ color: "rgba(244,241,236,0.75)" }}
            >
              {meta.note}
            </p>
          </div>

          {/* Embedded AI insight panel — glass, integrated into the hero */}
          <div
            className="w-full rounded-2xl p-5 sm:p-6"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{
                  backgroundColor: "rgba(131,127,216,0.22)",
                  color: "#E7E5F8",
                }}
              >
                <Sparkles className="h-3 w-3" />
                توصية الذكاء الاصطناعي
              </span>
              <span
                className="text-[10px] font-semibold"
                style={{ color: "rgba(244,241,236,0.55)" }}
              >
                • الثقة: {insight.confidenceLabel}
              </span>
            </div>

            <h3
              className="mt-3 text-lg font-bold sm:text-xl"
              style={{ color: "#FFFFFF" }}
            >
              تحليل جاهزيتك المالية
            </h3>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: "rgba(244,241,236,0.82)" }}
            >
              {insight.body}
            </p>

            {/* Two compact insight cards */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniInsightCard
                icon={<AlertTriangle className="h-4 w-4" />}
                iconTintBg="rgba(213,141,121,0.18)"
                iconTintColor="#F6D5C6"
                eyebrow="أهم سبب"
                body={insight.mainReason}
              />
              <MiniInsightCard
                icon={<TrendingUp className="h-4 w-4" />}
                iconTintBg="rgba(184,219,203,0.18)"
                iconTintColor="#DFF5EC"
                eyebrow="أفضل إجراء"
                body={insight.bestAction}
              />
            </div>
          </div>

          {/* Primary CTA — kept at the bottom of the hero per spec */}
          <Link to="/app/savings-plan">
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-card transition hover:opacity-90"
              style={{ backgroundColor: BANK.accent }}
            >
              عرض خطة الادخار
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* Compact glass insight card used inside ReadinessHero. */
function MiniInsightCard({
  icon,
  iconTintBg,
  iconTintColor,
  eyebrow,
  body,
}: {
  icon: React.ReactNode;
  iconTintBg: string;
  iconTintColor: string;
  eyebrow: string;
  body: string;
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3.5"
      style={{
        backgroundColor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <span
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconTintBg, color: iconTintColor }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "rgba(244,241,236,0.6)" }}
        >
          {eyebrow}
        </p>
        <p
          className="mt-1 text-xs font-semibold leading-relaxed sm:text-sm"
          style={{ color: "#FFFFFF" }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* 3) Indicator card — premium executive card                          */
/* ================================================================== */

interface IndicatorCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  progress?: number;
  tone: Tone;
  explanation: string;
  fallbackExplanations?: Partial<Record<Tone, string>>;
  /** Optional per-card status pill (encouraging framing for some metrics). */
  statusOverride?: string;
}

function IndicatorCard({
  icon,
  label,
  value,
  progress,
  tone,
  explanation,
  fallbackExplanations,
  statusOverride,
}: IndicatorCardProps) {
  const s = TONE_STYLES[tone];
  const line = tone === "ok" ? explanation : fallbackExplanations?.[tone] ?? explanation;
  const statusLabel = statusOverride ?? s.statusLabel;

  // Every card renders an identical 4px bar. When a card has no explicit
  // percentage (e.g. currency-value leakage), use a tone-mapped synthetic
  // width so the visual weight matches — no numeric calculation changes.
  const barPct =
    typeof progress === "number"
      ? Math.max(4, Math.min(100, progress))
      : TONE_SYNTHETIC_PROGRESS[tone];

  return (
    <div
      className="flex h-full flex-col p-5"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #F1ECE7",
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(15,42,46,0.03), 0 2px 8px rgba(15,42,46,0.04)",
      }}
    >
      {/* Top row: badge on LEFT (Arabic RTL flips DOM order visually) — icon on RIGHT */}
      <div className="flex items-center justify-between gap-3">
        {/* Icon in pastel circular tone background — always on the right in RTL */}
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: s.iconBg, color: s.iconColor }}
        >
          {icon}
        </span>
        {/* Status pill — always on the left in RTL */}
        <span
          className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold leading-none"
          style={{ backgroundColor: s.chipBg, color: s.chipText }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Middle: title + large value */}
      <p
        className="mt-5 text-[11px] font-medium"
        style={{ color: BANK.muted }}
      >
        {label}
      </p>
      <p
        className="mt-1.5 text-[26px] font-bold leading-none tabular-nums tracking-tight"
        style={{ color: s.text }}
      >
        {value}
      </p>

      {/* Push helper + bar to the bottom so every card has identical height */}
      <div className="mt-auto">
        {/* Unified 4px progress bar — same on every card */}
        <div
          className="mt-5 h-1 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "#F1ECE7" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${barPct}%`,
              backgroundColor: s.bar,
            }}
          />
        </div>

        {/* Helper sentence */}
        <p
          className="mt-3 text-[12px] leading-relaxed"
          style={{ color: BANK.muted }}
        >
          {line}
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/* 4) Executive insights card — one elegant paragraph                  */
/* ================================================================== */

function InsightsCard({ summary }: { summary: string }) {
  return (
    <section
      className="rounded-3xl p-8 shadow-card sm:p-10"
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BANK.paperEdge}`,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: BANK.accent }}
      >
        ملاحظة تنفيذية
      </p>
      <h3
        className="mt-2 text-xl font-bold sm:text-2xl"
        style={{ color: BANK.ink }}
      >
        أهم ما اكتشفناه
      </h3>
      <p
        className="mt-4 max-w-3xl text-base leading-loose sm:text-lg"
        style={{ color: BANK.muted }}
      >
        {summary}
      </p>
    </section>
  );
}

function buildExecutiveSummary(tones: {
  stability: Tone;
  dti: Tone;
  ef: Tone;
  leakage: Tone;
}): string {
  const good = (t: Tone) => t === "ok" || t === "primary";

  const strong: string[] = [];
  const attention: string[] = [];

  if (good(tones.stability)) strong.push("دخلاً مستقراً");
  else attention.push("عدم ثبات دخلك");

  if (good(tones.dti)) strong.push("التزامات ضمن الحدود الآمنة");
  else attention.push("ارتفاع نسبة الالتزامات");

  if (good(tones.ef)) strong.push("صندوق طوارئ قوي");
  else attention.push("ضعف صندوق الطوارئ");

  if (good(tones.leakage)) strong.push("إنفاقاً مضبوطاً");
  else attention.push("مصروفات قابلة للتقليل دون التأثير على الأساسيات");

  if (strong.length === 0 && attention.length > 0) {
    return `يظهر تقريرك ${listAr(attention)} — العمل عليها سيرفع جاهزيتك المالية وقدرتك على الادخار.`;
  }
  if (attention.length === 0) {
    return `يعكس تقريرك وضعاً مالياً متوازناً: ${listAr(strong)}. استمر على هذا المسار للحفاظ على جاهزيتك المالية العالية.`;
  }
  return `لديك ${listAr(strong)}، لكن ${listAr(attention)} يؤثر على جاهزيتك المالية وقدرتك على الادخار.`;
}

function listAr(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} و${items[1]}`;
  return `${items.slice(0, -1).join("، ")} و${items[items.length - 1]}`;
}

/* ================================================================== */
/* 5) Monthly Update — compact card                                     */
/* ================================================================== */

interface MonthlyUpdateCompactProps {
  state: "before" | "due" | "overdue" | "completed";
  daysDisplay: number;
  nextInDays: number;
  completedMonthLabel: string | null;
  latestLabel: string | null;
}

function MonthlyUpdateCompact({
  state,
  daysDisplay,
  nextInDays,
  completedMonthLabel,
  latestLabel,
}: MonthlyUpdateCompactProps) {
  const status =
    state === "completed"
      ? {
          eyebrow: latestLabel ? `آخر تحديث: ${latestLabel}` : "لم يتم بعد أي تحديث",
          title: `تم تحديث شهر ${completedMonthLabel ?? ""}`,
          body: nextInDays > 0
            ? `التحديث القادم بعد ${daysWord(nextInDays)}.`
            : "التحديث القادم قريباً.",
          icon: <CalendarCheck className="h-5 w-5" />,
          showButton: false,
        }
      : state === "due"
      ? {
          eyebrow: latestLabel ? `آخر تحديث: ${latestLabel}` : "لم يتم بعد أي تحديث",
          title: "حان وقت التحديث",
          body: "سجّل ما ادخرته هذا الشهر لإبقاء خطتك دقيقة.",
          icon: <CalendarCheck className="h-5 w-5" />,
          showButton: true,
        }
      : state === "overdue"
      ? {
          eyebrow: latestLabel ? `آخر تحديث: ${latestLabel}` : "لم يتم بعد أي تحديث",
          title: `متأخر منذ ${daysWord(daysDisplay)}`,
          body: "حدّث ادخارك الآن للحفاظ على دقة خطتك المالية.",
          icon: <AlertTriangle className="h-5 w-5" />,
          showButton: true,
        }
      : {
          eyebrow: latestLabel ? `آخر تحديث: ${latestLabel}` : "لم يتم بعد أي تحديث",
          title: `التحديث القادم بعد ${daysWord(daysDisplay)}`,
          body: "ستستطيع تسجيل ما ادخرته حين يحل موعد التحديث الشهري.",
          icon: <CalendarClock className="h-5 w-5" />,
          showButton: false,
        };

  return (
    <section
      className="flex flex-wrap items-center justify-between gap-6 rounded-3xl p-6 shadow-card sm:p-8"
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BANK.paperEdge}`,
      }}
    >
      <div className="flex items-start gap-4">
        <span
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: BANK.paper,
            color: BANK.inkAlt,
          }}
        >
          {status.icon}
        </span>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BANK.muted }}
          >
            {status.eyebrow}
          </p>
          <h3
            className="mt-1 text-lg font-bold sm:text-xl"
            style={{ color: BANK.ink }}
          >
            {status.title}
          </h3>
          <p className="mt-1 max-w-md text-sm" style={{ color: BANK.muted }}>
            {status.body}
          </p>
        </div>
      </div>

      {status.showButton && (
        <Link to="/app/checkin">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-card transition hover:opacity-90"
            style={{ backgroundColor: BANK.accent }}
          >
            <CalendarCheck className="h-4 w-4" />
            حدّث الآن
          </button>
        </Link>
      )}
    </section>
  );
}

/* ================================================================== */
/* 6) Smart Recommendation — premium dark card                          */
/* ================================================================== */

function SmartRecommendationHero({ body }: { body: string }) {
  return (
    <section
      className="relative overflow-hidden rounded-[32px] p-8 shadow-elevated sm:p-10"
      style={{
        background: `linear-gradient(135deg, ${BANK.ink} 0%, ${BANK.inkAlt} 60%, #0A2C50 100%)`,
        color: "#F4F1EC",
      }}
    >
      {/* Decorative lines */}
      <svg
        className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 opacity-[0.06]"
        viewBox="0 0 400 400"
        aria-hidden="true"
      >
        <circle cx="200" cy="200" r="180" stroke="#F4F1EC" strokeWidth="1" fill="none" />
        <circle cx="200" cy="200" r="140" stroke="#F4F1EC" strokeWidth="1" fill="none" />
        <circle cx="200" cy="200" r="100" stroke="#F4F1EC" strokeWidth="1" fill="none" />
      </svg>
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: `${BANK.ai}22` }}
      />

      <div className="relative grid gap-8 md:grid-cols-[auto_1fr] md:items-center md:gap-10">
        {/* Elegant AI mark */}
        <div
          className="mx-auto flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-3xl md:mx-0"
          style={{
            backgroundColor: "rgba(131,127,216,0.18)",
            border: "1px solid rgba(131,127,216,0.35)",
          }}
        >
          <Sparkles className="h-10 w-10" style={{ color: "#E7E5F8" }} />
        </div>

        <div className="flex flex-col items-start gap-5">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold"
            style={{ backgroundColor: "rgba(131,127,216,0.22)", color: "#E7E5F8" }}
          >
            <Sparkles className="h-3 w-3" />
            توصية ذكية
          </span>
          <h2
            className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
            style={{ color: "#FFFFFF" }}
          >
            توصية لتحسين وضعك
          </h2>
          <p
            className="max-w-xl text-sm leading-relaxed sm:text-base"
            style={{ color: "rgba(244,241,236,0.75)" }}
          >
            {body}
          </p>
          <Link to="/app/savings-plan">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-card transition hover:opacity-90"
              style={{ backgroundColor: BANK.accent }}
            >
              عرض خطة الادخار الذكية
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function buildSmartRecommendation(input: {
  readiness: number;
  dti: Tone;
  ef: Tone;
  leakage: Tone;
}): string {
  // Priority: DTI → Emergency Fund → Leakage → Readiness fallback
  if (input.dti === "danger" || input.dti === "warn") {
    return "خفض الالتزامات بنسبة 20% يمكن أن يرفع جاهزيتك المالية بشكل ملحوظ ويزيد قدرتك على الادخار.";
  }
  if (input.ef === "danger" || input.ef === "warn") {
    return "بناء صندوق طوارئ يغطي 3 إلى 6 أشهر من مصاريفك سيرفع جاهزيتك المالية ويحميك من المفاجآت.";
  }
  if (input.leakage === "danger" || input.leakage === "warn") {
    return "تقليل المصاريف غير الضرورية سيحرر مبلغاً شهرياً إضافياً يمكن توجيهه للادخار مباشرة.";
  }
  if (input.readiness >= 75) {
    return "جاهزيتك المالية قوية — الحفاظ على مستوى الادخار الحالي سيسرّع تحقيق أهدافك القادمة.";
  }
  return "رفع قدرتك على الادخار الشهري ولو بمبلغ صغير سينعكس مباشرة على جاهزيتك المالية على المدى الطويل.";
}

/* ================================================================== */
/* 4b) AI Financial Readiness Insight — Before-Financing narrative      */
/* ================================================================== */

interface ReadinessInsight {
  body: string;
  confidenceLabel: "عالية" | "متوسطة" | "مقبولة";
  confidenceTone: "ok" | "primary" | "warn";
  reasons: string[];
  /** Short "أهم سبب" line — the single most-impactful blocker. */
  mainReason: string;
  /** Short "أفضل إجراء" line — the most-impactful next step. */
  bestAction: string;
}

function buildReadinessInsight(input: {
  readiness: number;
  stability: Tone;
  dti: Tone;
  ef: Tone;
  leakage: Tone;
}): ReadinessInsight {
  const good = (t: Tone) => t === "ok" || t === "primary";
  const bad = (t: Tone) => t === "warn" || t === "danger";

  // Narrative — 2-3 short lines, before-financing framing.
  let body: string;
  if (input.readiness >= 75) {
    body =
      "بناءً على سلوكك المالي الحالي، تبدو مستعداً من الناحية المالية للنظر في خيارات التمويل. مؤشراتك الأساسية ضمن الحدود الآمنة، والحفاظ على هذا المستوى سيدعم فرصك في القبول.";
  } else if (bad(input.dti) && bad(input.ef)) {
    body =
      "دخلك يوفر أساساً معقولاً، لكن ارتفاع الالتزامات وضعف صندوق الطوارئ يحدّان من جاهزيتك للتمويل حالياً. تحسين هذين المؤشرين سيرفع فرص القبول بشكل ملحوظ.";
  } else if (bad(input.dti)) {
    body =
      "دخلك مستقر، لكن نسبة الالتزامات تحدّ من جاهزيتك للتمويل. تخفيض بسيط في الالتزامات الشهرية قد يرفع أهليتك للتمويل بشكل ملحوظ.";
  } else if (bad(input.ef)) {
    body =
      "مؤشراتك الأساسية إيجابية، لكن ضعف صندوق الطوارئ قد يقلّل من ثقة الجهة التمويلية. بناء احتياطي يغطي 3 إلى 6 أشهر سيرفع جاهزيتك قبل التقدّم لطلب تمويل.";
  } else if (bad(input.stability)) {
    body =
      "التزاماتك وصندوق طوارئك في مستوى مقبول، لكن عدم ثبات دخلك قد يؤثر على تقييم أهليتك. إثبات استقرار دخل لثلاثة أشهر متتالية يعزّز جاهزيتك بشكل مباشر.";
  } else if (bad(input.leakage)) {
    body =
      "بناءً على سلوكك المالي، جاهزيتك للتمويل في تحسّن. تقليل جزء من المصروفات غير الضرورية سيرفع القدرة على الادخار ويعزّز جاهزيتك قبل التقدّم للتمويل.";
  } else {
    body =
      "جاهزيتك المالية قيد التحسّن. الاستمرار في الحفاظ على استقرار الدخل وضبط الالتزامات سيدفع مؤشراتك تدريجياً نحو مستوى الجاهزية الكاملة للتمويل.";
  }

  // Confidence — number of "good" signals out of 4 core tones.
  const goodCount =
    (good(input.stability) ? 1 : 0) +
    (good(input.dti) ? 1 : 0) +
    (good(input.ef) ? 1 : 0) +
    (good(input.leakage) ? 1 : 0);

  let confidenceLabel: ReadinessInsight["confidenceLabel"];
  let confidenceTone: ReadinessInsight["confidenceTone"];
  if (goodCount >= 3) {
    confidenceLabel = "عالية";
    confidenceTone = "ok";
  } else if (goodCount === 2) {
    confidenceLabel = "متوسطة";
    confidenceTone = "primary";
  } else {
    confidenceLabel = "مقبولة";
    confidenceTone = "warn";
  }

  // Short reasons (for the "لماذا؟" modal — max 4)
  const reasons: string[] = [];
  reasons.push(
    good(input.stability)
      ? "ثبات دخلك يدعم قدرتك على السداد المنتظم."
      : "دخلك يحتاج ثباتاً أكبر لتعزيز جاهزيتك للتمويل."
  );
  reasons.push(
    good(input.dti)
      ? "نسبة الالتزامات ضمن الحدود الآمنة للجهات التمويلية."
      : "ارتفاع نسبة الالتزامات يحدّ من هامش السداد المتاح."
  );
  reasons.push(
    good(input.ef)
      ? "صندوق الطوارئ يوفر حماية من الطوارئ ويطمئن الجهة التمويلية."
      : "ضعف صندوق الطوارئ قد يقلّل من ثقة الجهة التمويلية."
  );
  if (bad(input.leakage)) {
    reasons.push(
      "توجد مصروفات قابلة للتقليل يمكن توجيهها للسداد أو للادخار."
    );
  }

  // Main reason — single most-impactful blocker (or a healthy-state message).
  let mainReason: string;
  if (bad(input.dti)) {
    mainReason = "ارتفاع نسبة الالتزامات الشهرية.";
  } else if (bad(input.ef)) {
    mainReason = "ضعف صندوق الطوارئ الحالي.";
  } else if (bad(input.stability)) {
    mainReason = "عدم ثبات الدخل الشهري.";
  } else if (bad(input.leakage)) {
    mainReason = "مصروفات شهرية قابلة للتقليل.";
  } else {
    mainReason = "لا يوجد عائق واضح — الاستمرار على المسار الحالي.";
  }

  // Best action — highest-leverage next step given the mainReason.
  let bestAction: string;
  if (bad(input.dti)) {
    bestAction = "الالتزام بخطة الادخار لمدة 3 أشهر قبل التقدّم لأي تمويل.";
  } else if (bad(input.ef)) {
    bestAction = "بناء احتياطي طوارئ يغطي 3 إلى 6 أشهر من مصاريفك.";
  } else if (bad(input.stability)) {
    bestAction = "إثبات استقرار دخل لثلاثة أشهر متتالية.";
  } else if (bad(input.leakage)) {
    bestAction = "توجيه المصروفات القابلة للتقليل إلى الادخار الشهري.";
  } else {
    bestAction = "الحفاظ على مستوى الادخار الحالي لتأكيد جاهزيتك.";
  }

  return {
    body,
    confidenceLabel,
    confidenceTone,
    reasons: reasons.slice(0, 4),
    mainReason,
    bestAction,
  };
}


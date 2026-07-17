import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Gauge,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Info,
  BarChart2,
  Wallet,
  Coins,
  CreditCard,
  TrendingDown,
} from "lucide-react";
import { Card } from "../../components/shared/Card";
import { EmptyState } from "../../components/shared/EmptyState";
import { LoadingOverlay } from "../../components/shared/LoadingOverlay";
import { useAnalysis } from "../analysis/analysisStore";
import { api } from "../../lib/api";
import { ReadinessResult } from "../../types";
import { formatPercent, formatSAR } from "../../lib/format";

/* ------------------------------------------------------------------ */
/* Bank palette (Financing Eligibility only — re-skin)                 */
/* ------------------------------------------------------------------ */

const BANK = {
  paper:    "#fcf8f5",
  ink:      "#02151e",
  inkAlt:   "#002134",
  muted:    "#3f3c3e",
  accent:   "#d58d79",
  ai:       "#837fd8",
  paperEdge:"#E8E2DC",
  // "Positive" tone — navy-based (no green anywhere).
  positive:     "#002134",
  positiveLight:"#EAEFF3",
  amber:        "#d8a24d",
  amberLight:   "#FBEDE5",
  criticalLight:"#F9E7E2",
} as const;

// Verdict → tone tokens (kept for the existing Badge component's tone prop)
const VERDICT_META: Record<
  ReadinessResult["verdict"],
  { label: string; tone: "ok" | "warn" | "danger"; message: string }
> = {
  ready: {
    label: "جاهز",
    tone: "ok",
    message: "تبدو مستعداً من الناحية المالية للنظر في خيارات التمويل.",
  },
  almost_ready: {
    label: "قريب من الجاهزية",
    tone: "warn",
    message: "مؤشراتك قريبة من العتبة الآمنة، تحسينات بسيطة قد تكفي.",
  },
  not_ready: {
    label: "غير جاهز حالياً",
    tone: "danger",
    message: "من الأفضل تحسين مؤشراتك المالية قبل التقدّم لطلب تمويل.",
  },
};

// Factor tone → inline bank-palette colors (soft green / soft coral / very light red)
const FACTOR_META: Record<
  "ok" | "warn" | "danger",
  {
    icon: React.ReactNode;
    bg: string;
    borderRight: string;
    iconBg: string;
    iconColor: string;
    textColor: string;
    detailColor: string;
  }
> = {
  ok: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    bg: BANK.positiveLight,
    borderRight: BANK.inkAlt,
    iconBg: "#FFFFFF",
    iconColor: BANK.inkAlt,
    textColor: BANK.inkAlt,
    detailColor: BANK.muted,
  },
  warn: {
    icon: <AlertTriangle className="h-4 w-4" />,
    bg: BANK.amberLight,
    borderRight: BANK.accent,
    iconBg: "#FFFFFF",
    iconColor: BANK.accent,
    textColor: BANK.inkAlt,
    detailColor: BANK.muted,
  },
  danger: {
    icon: <AlertTriangle className="h-4 w-4" />,
    bg: BANK.criticalLight,
    borderRight: BANK.accent, // coral instead of bright red
    iconBg: "#FFFFFF",
    iconColor: BANK.accent,
    textColor: BANK.inkAlt,
    detailColor: BANK.muted,
  },
};

// Spec-defined readiness ring color — fixed coral fill for the completed
// portion of the ring, regardless of tier.
function readinessRingColor(_score: number): string {
  return "#D58D79";
}

/* ------------------------------------------------------------------ */
/* Simple, user-friendly factors — replaces the technical backend list */
/* Only what an average user needs to see, in plain Arabic.            */
/* ------------------------------------------------------------------ */

interface SimpleFactor {
  key: string;
  icon: React.ReactNode;
  name: string;
  value: string;
  detail: string;
  status: "ok" | "warn" | "danger";
}

function buildSimpleFactors(
  salary: number,
  expenses: number,
  monthlyCommitments: number,
  commitmentsRatio: number,
  monthlyCashFlow: number
): SimpleFactor[] {
  // Expense ratio (share of salary consumed by recurring expenses).
  const expenseRatio = salary > 0 ? (expenses / salary) * 100 : 0;
  const expenseStatus: SimpleFactor["status"] =
    expenseRatio <= 55 ? "ok" : expenseRatio <= 75 ? "warn" : "danger";

  // Commitments (matches backend thresholds for commitments ratio: 30 / 45).
  const commitmentsStatus: SimpleFactor["status"] =
    commitmentsRatio <= 30 ? "ok" : commitmentsRatio <= 45 ? "warn" : "danger";

  // Cash flow as % of income.
  const cashFlowRatio = salary > 0 ? (monthlyCashFlow / salary) * 100 : 0;
  const cashFlowStatus: SimpleFactor["status"] =
    cashFlowRatio >= 25 ? "ok" : cashFlowRatio >= 10 ? "warn" : "danger";

  // Income status — informational (always "ok" once we have a salary figure).
  const incomeStatus: SimpleFactor["status"] = salary > 0 ? "ok" : "danger";

  return [
    {
      key: "income",
      icon: <Coins className="h-4 w-4" />,
      name: "الدخل الشهري",
      value: `${formatSAR(salary)} / شهر`,
      detail:
        "إجمالي الدخل الشهري المُعتَمد كأساس لتقييم أهلية التمويل.",
      status: incomeStatus,
    },
    {
      key: "expenses",
      icon: <Wallet className="h-4 w-4" />,
      name: "المصاريف الشهرية",
      value: `${formatSAR(expenses)} / شهر`,
      detail:
        "إجمالي المصاريف الشهرية المتكررة التي تؤثر على قدرتك على السداد.",
      status: expenseStatus,
    },
    {
      key: "commitments",
      icon: <CreditCard className="h-4 w-4" />,
      name: "الالتزامات المالية الشهرية",
      value: `${Math.round(commitmentsRatio)}%`,
      detail:
        "نسبة الدخل الشهري المخصّصة للقروض والالتزامات المالية — كلما انخفضت زادت جاهزيتك للتمويل.",
      status: commitmentsStatus,
    },
    {
      key: "cashflow",
      icon:
        monthlyCashFlow >= 0 ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        ),
      name: "التدفق النقدي المتبقي",
      value: `${formatSAR(monthlyCashFlow)} / شهر`,
      detail:
        "المبلغ المتبقي بعد خصم كل المصاريف والالتزامات — كلما ارتفع دلّ على استقرار مالي أفضل.",
      status: cashFlowStatus,
    },
  ];
}

/* Local readiness ring — same visual layout as ScoreRing but uses the
   Financing-Eligibility bank palette without touching the shared component. */
function ReadinessRing({
  value,
  size = 180,
  stroke = 12,
  label,
  hint,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  hint?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = readinessRingColor(clamped);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke={BANK.paperEdge}
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke={color}
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
            className="text-3xl font-bold"
            style={{ color: "#FFFFFF" }}
          >
            {Math.round(clamped)}
          </span>
          <span
            className="text-[10px] font-semibold"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            من 100
          </span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>
          {label}
        </p>
        {hint && (
          <p
            className="mt-0.5 text-xs"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/* Local page header — navy icon tile, matches other redesigned pages. */
function InlinePageHeader({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-card"
          style={{ backgroundColor: BANK.inkAlt, color: "#FFFFFF" }}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BANK.muted }}
          >
            {eyebrow}
          </p>
          <h1
            className="mt-1 text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: BANK.ink }}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm" style={{ color: BANK.muted }}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* Local section header — coral-tinted icon tile, no green anywhere. */
function SectionHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${BANK.accent}18`, color: BANK.inkAlt }}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold" style={{ color: BANK.ink }}>
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs" style={{ color: BANK.muted }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function FinancingReadinessPage() {
  const { input, result, hasAnalysis } = useAnalysis();
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAnalysis || !input || !result) {
      setReadiness(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .post<ReadinessResult>("/readiness", { input, analysis: result })
      .then(({ data }) => !cancelled && setReadiness(data))
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "تعذّر إجراء الفحص.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [hasAnalysis, input, result]);

  if (!hasAnalysis || !result || !input) {
    return (
      <div>
        <InlinePageHeader
          eyebrow="فحص أهلية التمويل"
          title="هل أنا جاهز مالياً لطلب تمويل؟"
          description="نقيّم استعدادك بناءً على تحليلك المالي — تعليمياً فقط، ليس قراراً بنكياً."
          icon={<Gauge className="h-5 w-5" />}
        />
        <Card>
          <EmptyState
            icon={<BarChart2 className="h-6 w-6" style={{ color: BANK.inkAlt }} />}
            title="نحتاج تحليلاً مالياً أولاً"
            description="أنجز تحليلك المالي حتى نتمكن من تقييم استعدادك بشكل دقيق."
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
        </Card>
      </div>
    );
  }

  return (
    <div>
      <InlinePageHeader
        eyebrow="فحص أهلية التمويل"
        title="هل أنا جاهز مالياً لطلب تمويل؟"
        description="تقييم تعليمي مبني على مؤشرات مالية أساسية — لمساعدتك على الاستعداد قبل التقدّم لأي جهة تمويلية."
        icon={<Gauge className="h-5 w-5" />}
      />

      {/* Educational disclaimer banner — soft AI purple */}
      <div
        className="mb-6 flex items-start gap-3 rounded-2xl p-4 text-xs leading-relaxed"
        style={{
          backgroundColor: "rgba(131,127,216,0.08)",
          border: `1px solid ${BANK.ai}`,
          color: BANK.muted,
        }}
      >
        <Info
          className="mt-0.5 h-4 w-4 flex-shrink-0"
          style={{ color: BANK.ai }}
        />
        <p>
          <span className="font-bold" style={{ color: BANK.inkAlt }}>
            تنبيه هام:
          </span>{" "}
          هذا الفحص تعليمي واستشاري فقط، مُولَّد بواسطة الذكاء الاصطناعي لمساعدتك على الاستعداد
          قبل التقدّم لطلب تمويل. لا يمثل قراراً بنكياً ولا يعني الموافقة أو الرفض من قبل أي جهة
          تمويلية.
        </p>
      </div>

      {readiness && (
        <>
          {/* HERO — verdict + score */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-8 shadow-elevated sm:p-10"
            style={{
              background: `linear-gradient(135deg, ${BANK.ink} 0%, ${BANK.inkAlt} 100%)`,
              color: "#FFFFFF",
            }}
          >
            {/* Soft decorative circles + coral glow */}
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
              style={{ backgroundColor: `${BANK.accent}33` }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -left-32 -bottom-20 h-72 w-72 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(0,33,52,0.6)" }}
              aria-hidden="true"
            />

            <div className="relative grid gap-10 md:grid-cols-[auto_1fr] md:items-center">
              <div className="flex justify-center md:justify-start">
                <div
                  className="rounded-3xl p-6 backdrop-blur-md"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <ReadinessRing
                    value={readiness.score}
                    size={180}
                    label="درجة الجاهزية للتمويل"
                    hint="تقييم تعليمي مبني على مؤشراتك"
                  />
                </div>
              </div>

              <div>
                {(() => {
                  const t = VERDICT_META[readiness.verdict].tone;
                  const pill =
                    t === "ok"
                      ? { bg: "rgba(213,141,121,0.22)", color: "#F6D5C6" }
                      : t === "warn"
                      ? { bg: "rgba(216,162,77,0.22)", color: "#F6E1B6" }
                      : { bg: "rgba(179,65,58,0.22)", color: "#F6D5D1" };
                  return (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                      style={{ backgroundColor: pill.bg, color: pill.color }}
                    >
                      <Sparkles className="h-3 w-3" />
                      الحكم: {VERDICT_META[readiness.verdict].label}
                    </span>
                  );
                })()}
                <h2 className="mt-4 text-2xl font-bold leading-tight sm:text-3xl">
                  {readiness.headline}
                </h2>
                <p
                  className="mt-3 max-w-2xl text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {readiness.explanation}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <MiniHero
                    label="التدفق النقدي الشهري"
                    value={formatSAR(readiness.monthlyCashFlow)}
                  />
                  <MiniHero label="نسبة الالتزامات" value={formatPercent(readiness.dti)} />
                  <MiniHero label="أهلية أولية" value={`${readiness.score} / 100`} />
                </div>
              </div>
            </div>
          </motion.section>

          {/* FACTORS */}
          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            <Card className="p-7 lg:col-span-2">
              <SectionHeader
                title="المؤشرات التي تم فحصها"
                subtitle="أساس التقييم"
                icon={<ShieldCheck className="h-4 w-4" />}
              />
              <ul className="space-y-3">
                {buildSimpleFactors(
                  input.salary,
                  input.expenses,
                  input.debts,
                  readiness.dti,
                  readiness.monthlyCashFlow
                ).map((f) => {
                  const meta = FACTOR_META[f.status];
                  return (
                    <li
                      key={f.key}
                      className="flex items-start gap-3 rounded-2xl p-4"
                      style={{
                        backgroundColor: meta.bg,
                        // RTL: visual "left border" per spec becomes right border
                        borderRight: `4px solid ${meta.borderRight}`,
                      }}
                    >
                      <span
                        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: meta.iconBg, color: meta.iconColor }}
                      >
                        {f.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p
                            className="text-sm font-bold"
                            style={{ color: meta.textColor }}
                          >
                            {f.name}
                          </p>
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{ color: meta.textColor }}
                          >
                            {f.value}
                          </span>
                        </div>
                        <p
                          className="mt-0.5 text-xs leading-relaxed"
                          style={{ color: meta.detailColor }}
                        >
                          {f.detail}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <div className="space-y-4">
              <Card className="p-6">
                <SectionHeader
                  title="نقاط القوة"
                  subtitle="ما يعمل لصالحك"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                />
                <ul className="space-y-2 text-sm" style={{ color: BANK.muted }}>
                  {readiness.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                        style={{ color: BANK.inkAlt }}
                      />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6">
                <SectionHeader
                  title="ما يحتاج للتحسين"
                  subtitle="قبل التقدّم للتمويل"
                  icon={<AlertTriangle className="h-4 w-4" />}
                />
                <ul className="space-y-2 text-sm" style={{ color: BANK.muted }}>
                  {readiness.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle
                        className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                        style={{ color: BANK.accent }}
                      />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </section>

          {/* NEXT STEPS */}
          <section className="mt-8">
            <Card className="p-7">
              <SectionHeader
                title="الخطوات التالية الموصى بها"
                subtitle="خطة عملية للاستعداد"
                icon={<TrendingUp className="h-4 w-4" />}
                action={
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{
                      backgroundColor: `${BANK.ai}18`,
                      color: BANK.ai,
                    }}
                  >
                    <Sparkles className="h-3 w-3" />
                    توصيات AI
                  </span>
                }
              />
              <div className="grid gap-3 sm:grid-cols-3">
                {readiness.nextSteps.map((step, i) => (
                  <div
                    key={i}
                    className="group rounded-2xl p-4 transition-colors duration-200"
                    style={{
                      backgroundColor: BANK.paper,
                      border: `1px solid ${BANK.paperEdge}`,
                    }}
                    onMouseEnter={(e) => {
                      const badge = e.currentTarget.querySelector<HTMLDivElement>(
                        "[data-step-badge]"
                      );
                      if (badge) badge.style.backgroundColor = BANK.accent;
                    }}
                    onMouseLeave={(e) => {
                      const badge = e.currentTarget.querySelector<HTMLDivElement>(
                        "[data-step-badge]"
                      );
                      if (badge) badge.style.backgroundColor = BANK.inkAlt;
                    }}
                  >
                    <div
                      data-step-badge
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white transition-colors duration-200"
                      style={{ backgroundColor: BANK.inkAlt }}
                    >
                      {i + 1}
                    </div>
                    <p
                      className="mt-3 text-sm leading-relaxed"
                      style={{ color: BANK.muted }}
                    >
                      {step}
                    </p>
                  </div>
                ))}
              </div>
              <div
                className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 text-xs"
                style={{
                  backgroundColor: "rgba(0,33,52,0.04)",
                  border: `1px solid ${BANK.paperEdge}`,
                  color: BANK.muted,
                }}
              >
                <span>{readiness.disclaimer}</span>
                <Link
                  to="/app/financial-analysis"
                  className="inline-flex items-center gap-1 font-semibold transition hover:opacity-80"
                  style={{ color: BANK.accent }}
                >
                  تحديث بياناتي المالية <ArrowLeft className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          </section>
        </>
      )}

      {error && (
        <div
          className="mt-4 rounded-xl p-3 text-xs"
          style={{
            backgroundColor: BANK.criticalLight,
            border: `1px solid ${BANK.accent}`,
            color: "#8A2F2A",
          }}
        >
          {error}
        </div>
      )}

      {loading && <LoadingOverlay label="جاري تحليل جاهزيتك للتمويل..." />}
    </div>
  );
}

function MiniHero({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl p-3 backdrop-blur-md"
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-base font-bold tabular-nums"
        style={{ color: "#FFFFFF" }}
      >
        {value}
      </p>
    </div>
  );
}

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Bot,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Info,
  AlertTriangle,
  Timer,
  ArrowLeft,
} from "lucide-react";
import { Card, CardHeader } from "../../components/shared/Card";
import { Badge } from "../../components/shared/Badge";
import { formatDate, formatSAR, cn } from "../../lib/format";
import { CoachResult, CoachStatus, useCoach } from "./useCoach";

const STATUS_META: Record<
  CoachStatus,
  { label: string; tone: "ok" | "primary" | "warn"; icon: React.ReactNode; barGradient: string; ring: string }
> = {
  ahead: {
    label: "متقدم على الخطة",
    tone: "ok",
    icon: <TrendingUp className="h-3 w-3" />,
    barGradient: "from-ok to-primary",
    ring: "ring-ok/25",
  },
  on_track: {
    label: "على المسار",
    tone: "primary",
    icon: <CheckCircle2 className="h-3 w-3" />,
    barGradient: "from-primary to-primary-dark",
    ring: "ring-primary/25",
  },
  behind: {
    label: "متأخر عن الخطة",
    tone: "warn",
    icon: <TrendingDown className="h-3 w-3" />,
    barGradient: "from-warn to-danger",
    ring: "ring-warn/25",
  },
};

const TIP_STYLES: Record<
  CoachResult["tips"][number]["tone"],
  { icon: React.ReactNode; bg: string; text: string; iconBg: string }
> = {
  ok: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    bg: "bg-ok-light",
    text: "text-ok-dark",
    iconBg: "bg-ok text-white",
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    bg: "bg-info-light",
    text: "text-info",
    iconBg: "bg-info text-white",
  },
  warn: {
    icon: <AlertTriangle className="h-4 w-4" />,
    bg: "bg-warn-light",
    text: "text-warn-dark",
    iconBg: "bg-warn text-white",
  },
  danger: {
    icon: <ShieldAlert className="h-4 w-4" />,
    bg: "bg-danger-light",
    text: "text-danger-dark",
    iconBg: "bg-danger text-white",
  },
};

export function CoachSection() {
  const { coach, loading, error } = useCoach();

  if (loading && !coach) {
    return (
      <section className="mt-10">
        <SectionHeader />
        <Card className="p-7">
          <div className="flex items-center gap-3 text-sm text-ink-mute">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-b-transparent" />
            <span>جاري تحليل تقدمك نحو الهدف...</span>
          </div>
        </Card>
      </section>
    );
  }

  if (error && !coach) {
    return (
      <section className="mt-10">
        <SectionHeader />
        <Card className="p-7">
          <div className="rounded-xl border border-danger/25 bg-danger-light p-3 text-xs text-danger-dark">
            {error}
          </div>
        </Card>
      </section>
    );
  }

  if (!coach) return null;

  const meta = STATUS_META[coach.status];
  const progress = Math.min(100, Math.max(0, coach.progressPercent));
  const expected = Math.min(100, Math.max(0, coach.expectedProgressPercent));
  const remaining = Math.max(0, coach.goalPrice - coach.currentSavings);

  return (
    <section className="mt-10">
      <SectionHeader />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Progress tracker (2/3) */}
        <Card className="p-7 lg:col-span-3">
          <CardHeader
            title={`متتبع التقدم — ${coach.goal}`}
            subtitle="مراقبة مستمرة لخطتك المالية الشخصية"
            icon={<Target className="h-4 w-4" />}
            action={
              <Badge tone={meta.tone} icon={meta.icon}>
                {meta.label}
              </Badge>
            }
          />

          {/* Progress bar with expected marker */}
          <div className="relative mt-2 h-4 w-full overflow-hidden rounded-full bg-outline">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full bg-gradient-to-l shadow-inner",
                meta.barGradient
              )}
            />
            {expected > 0 && expected < 100 && (
              <div
                className="absolute top-0 h-full w-0.5 bg-ink/50"
                style={{ right: `${expected}%` }}
                title="التقدم المتوقع"
              />
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-mute">
            <span>
              التقدم الفعلي:{" "}
              <span className="font-bold text-ink">{coach.progressPercent}%</span>
            </span>
            <span>
              التقدم المتوقع:{" "}
              <span className="font-bold text-ink">{coach.expectedProgressPercent}%</span>
            </span>
          </div>

          {/* KPI grid */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat
              icon={<TrendingUp className="h-4 w-4" />}
              label="التقدم الحالي"
              value={`${coach.progressPercent}%`}
              tone={meta.tone}
            />
            <MiniStat
              icon={<Target className="h-4 w-4" />}
              label="المبلغ المتبقي"
              value={formatSAR(remaining)}
              tone="primary"
            />
            <MiniStat
              icon={<Calendar className="h-4 w-4" />}
              label="تاريخ الإنجاز المتوقع"
              value={
                coach.estimatedCompletionDate === "—" || coach.monthsRemaining >= 999
                  ? "—"
                  : formatDate(coach.estimatedCompletionDate)
              }
              tone="info"
            />
            <MiniStat
              icon={<Timer className="h-4 w-4" />}
              label="الانحراف عن الخطة"
              value={
                coach.status === "on_track"
                  ? "على المسار"
                  : `${Math.abs(coach.driftMonths).toFixed(1)} شهر ${
                      coach.status === "behind" ? "متأخر" : "متقدم"
                    }`
              }
              tone={meta.tone}
            />
          </div>

          {/* Pace comparison */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-outline bg-surface-alt/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
                معدل الادخار الشهري الفعلي
              </p>
              <p className="mt-1 text-lg font-bold text-ink">
                {formatSAR(coach.actualMonthlySavings)}
              </p>
            </div>
            <div className="rounded-2xl border border-outline bg-surface-alt/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
                الادخار المطلوب شهرياً
              </p>
              <p className="mt-1 text-lg font-bold text-ink">
                {formatSAR(coach.requiredMonthlySavings)}
              </p>
            </div>
          </div>
        </Card>

        {/* Coach headline + tips (1/3 becomes 2/5) */}
        <Card className="p-7 lg:col-span-2">
          <CardHeader
            title="المدرّب المالي الذكي"
            subtitle="توصيات مخصصة لهذا الشهر"
            icon={<Bot className="h-4 w-4" />}
            action={<Badge tone="primary" icon={<Sparkles className="h-3 w-3" />}>AI</Badge>}
          />

          <div
            className={cn(
              "rounded-2xl bg-gradient-to-l from-primary via-primary-dark to-[#082E2A] p-5 text-white shadow-card ring-4",
              meta.ring
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
              رسالة المدرّب
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed">{coach.headline}</p>
          </div>

          <ul className="mt-4 space-y-2.5">
            {coach.tips.map((t, i) => {
              const s = TIP_STYLES[t.tone];
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn("flex items-start gap-3 rounded-2xl p-3", s.bg)}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl",
                      s.iconBg
                    )}
                  >
                    {s.icon}
                  </span>
                  <div>
                    <p className={cn("text-sm font-bold", s.text)}>{t.title}</p>
                    <p className={cn("mt-0.5 text-xs leading-relaxed", s.text, "opacity-90")}>
                      {t.body}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </Card>
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent-dark">
          المدرّب المالي
        </p>
        <p className="text-xs text-ink-mute">
          مراقبة مستمرة لتقدمك نحو هدفك الشخصي مع نصائح ذكية
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/app/savings-plan"
          className="inline-flex items-center gap-1 rounded-xl border border-outline bg-card px-3 py-1.5 text-[11px] font-bold text-primary hover:border-primary/40"
        >
          فتح خطة الادخار الذكية
          <ArrowLeft className="h-3 w-3" />
        </Link>
        <Badge tone="gold" icon={<Bot className="h-3 w-3" />}>
          مساعد AI شخصي
        </Badge>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "ok" | "warn" | "primary" | "info";
}) {
  const toneClasses = {
    ok: "bg-ok-light text-ok-dark",
    warn: "bg-warn-light text-warn-dark",
    primary: "bg-primary-light text-primary-dark",
    info: "bg-info-light text-info",
  }[tone];

  return (
    <div className="rounded-2xl border border-outline bg-card p-4">
      <div className="flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", toneClasses)}>
          {icon}
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
          {label}
        </p>
      </div>
      <p className="mt-2 text-base font-bold text-ink">{value}</p>
    </div>
  );
}

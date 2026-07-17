import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sliders, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "../../components/shared/Button";
import { cn, formatDate, formatSAR } from "../../lib/format";
import { useActivePlan } from "./activePlanStore";

interface Props {
  goalPrice: number;
  currentSavings: number;
  actualMonthly: number;
  recommendedMonthly: number;
  recommendedMonths: number;
  recommendedDate: string; // ISO date or "—"
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

export function PlanModeSection({
  goalPrice,
  currentSavings,
  actualMonthly,
  recommendedMonthly,
  recommendedMonths,
  recommendedDate,
}: Props) {
  const { plan: active, setMode, setCustomMonths, activate } = useActivePlan();
  const [months, setMonths] = useState<number>(active.customMonths);

  useEffect(() => {
    setMonths(active.customMonths);
  }, [active.customMonths]);

  const remaining = Math.max(0, goalPrice - currentSavings);

  const custom = useMemo(() => {
    const m = Math.max(1, Math.min(120, Math.round(months) || 1));
    const requiredMonthly = Math.round(remaining / m);
    const date = new Date(Date.now() + m * MS_PER_MONTH).toISOString();
    // "Unrealistic" = required monthly is significantly higher than the current actual saving rate.
    const capacity = Math.max(1, actualMonthly);
    const isTight = requiredMonthly > capacity * 1.25;
    return { months: m, requiredMonthly, date, isTight };
  }, [months, remaining, actualMonthly]);

  const isAiActive = active.mode === "ai";
  const isCustomActive = active.mode === "custom";

  return (
    <section className="rounded-[28px] border border-outline bg-card p-8 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            وضع الخطة
          </p>
          <h3 className="mt-1 text-lg font-bold text-ink">اختر طريقة تخطيطك</h3>
          <p className="mt-1 text-xs text-ink-mute">
            الخطة النشطة تُستخدم في التقدم، التحديث الشهري، والتوصيات.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold",
            "bg-primary-light text-primary-dark"
          )}
        >
          <CheckCircle2 className="h-3 w-3" />
          الخطة النشطة: {isAiActive ? "خطة الذكاء الاصطناعي" : "خطة مخصصة"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* --- OPTION 1: AI RECOMMENDED --- */}
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={cn(
            "flex flex-col items-start gap-3 rounded-2xl border p-5 text-right transition",
            isAiActive
              ? "border-primary bg-primary-light/50 shadow-card"
              : "border-outline bg-card hover:border-primary/40"
          )}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  isAiActive ? "bg-primary text-white" : "bg-primary-light text-primary"
                )}
              >
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">خطة الذكاء الاصطناعي</p>
                <p className="text-[11px] text-ink-mute">اقتراح واقعي مبني على بياناتك</p>
              </div>
            </div>
            {isAiActive && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white">
                نشط
              </span>
            )}
          </div>

          <dl className="mt-2 grid w-full grid-cols-3 gap-3">
            <MiniFact label="المدة" value={`${recommendedMonths} شهر`} />
            <MiniFact label="الشهري" value={formatSAR(recommendedMonthly)} />
            <MiniFact
              label="الإنجاز"
              value={
                recommendedDate === "—"
                  ? "—"
                  : formatDate(recommendedDate)
              }
            />
          </dl>
        </button>

        {/* --- OPTION 2: CUSTOM TIMELINE --- */}
        <div
          className={cn(
            "flex flex-col gap-3 rounded-2xl border p-5 transition",
            isCustomActive
              ? "border-accent bg-accent-light/50 shadow-card"
              : "border-outline bg-card hover:border-accent/40"
          )}
        >
          <button
            type="button"
            onClick={() => setMode("custom")}
            className="flex w-full items-center justify-between text-right"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  isCustomActive ? "bg-accent text-white" : "bg-accent-light text-accent-dark"
                )}
              >
                <Sliders className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">خطة مخصصة</p>
                <p className="text-[11px] text-ink-mute">حدّد مدتك المفضلة</p>
              </div>
            </div>
            {isCustomActive && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-white">
                نشط
              </span>
            )}
          </button>

          {/* Duration input */}
          <label className="mt-1 flex items-center gap-3 rounded-xl border border-outline bg-surface-alt/40 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
              المدة
            </span>
            <input
              type="number"
              min={1}
              max={120}
              inputMode="numeric"
              value={months || ""}
              onChange={(e) => setMonths(Math.max(1, Math.min(120, Number(e.target.value) || 1)))}
              onFocus={() => setMode("custom")}
              className="w-16 bg-transparent text-base font-bold text-ink placeholder:text-ink-mute focus:outline-none"
            />
            <span className="text-xs font-semibold text-ink-mute">شهر</span>
          </label>

          <dl className="grid grid-cols-2 gap-3">
            <MiniFact
              label="الادخار المطلوب"
              value={`${formatSAR(custom.requiredMonthly)} / شهر`}
            />
            <MiniFact label="الإنجاز" value={formatDate(custom.date)} />
          </dl>

          {custom.isTight && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-xl border border-warn/25 bg-warn-light/70 p-3 text-xs text-warn-dark"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span>
                هذه المدة تتطلب التزاماً شهرياً أعلى من قدرتك المالية الحالية.
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Activation controls */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline bg-surface-alt/30 p-4">
        <p className="text-xs text-ink-mute">
          {isAiActive
            ? "الخطة الذكية نشطة الآن ومطبّقة على تقدمك."
            : `الخطة المخصصة (${active.customMonths} شهر) نشطة الآن.`}
        </p>
        <div className="flex flex-wrap gap-2">
          {isCustomActive ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => activate("ai")}
              icon={<Bot className="h-3.5 w-3.5" />}
            >
              تفعيل الخطة الذكية
            </Button>
          ) : (
            <Button
              size="sm"
              variant="gold"
              onClick={() => {
                setCustomMonths(custom.months);
                activate("custom", custom.months);
              }}
              icon={<Sliders className="h-3.5 w-3.5" />}
            >
              تفعيل الخطة المخصصة
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline bg-card p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

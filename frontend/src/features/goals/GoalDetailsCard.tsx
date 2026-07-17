import { Trash2, CheckCircle2, BadgeCheck } from "lucide-react";
import { cn, formatDate, formatSAR } from "../../lib/format";
import { useGoals } from "./goalsStore";
import { useActivePlan } from "../savingsPlan/activePlanStore";

const PRIORITY_META = {
  high: { label: "عالية", cls: "bg-danger-light text-danger-dark" },
  medium: { label: "متوسطة", cls: "bg-warn-light text-warn-dark" },
  low: { label: "منخفضة", cls: "bg-primary-light text-primary-dark" },
} as const;

export function GoalDetailsCard() {
  const { activeGoal, deleteGoal, setCompleted } = useGoals();
  const { plan: activePlan } = useActivePlan();

  if (!activeGoal) return null;
  const g = activeGoal;

  // ---- Spec calculations ----
  const remainingAmount = Math.max(0, g.targetPrice - g.allocated);
  const isCompleted = remainingAmount === 0;
  const monthly = Math.max(0, g.monthlyAllocation ?? 0);
  const monthsRemaining =
    remainingAmount > 0 && monthly > 0
      ? Math.ceil(remainingAmount / monthly)
      : null;

  // ---- Spec-exact fallback copy ----
  const monthlyText = isCompleted
    ? "متوقف — الهدف مكتمل"
    : monthly > 0
    ? formatSAR(monthly)
    : "لم يتم تحديد ادخار شهري لهذا الهدف بعد.";

  const monthsText = isCompleted
    ? "تم تحقيق الهدف"
    : monthsRemaining !== null
    ? `${monthsRemaining} شهر`
    : "المدة غير متاحة حتى اعتماد التخصيص الشهري.";

  const expectedText = isCompleted
    ? "تم تحقيق الهدف"
    : monthsRemaining !== null
    ? formatDate(
        new Date(Date.now() + monthsRemaining * 30 * 24 * 60 * 60 * 1000).toISOString()
      )
    : g.targetDate
    ? formatDate(g.targetDate)
    : "غير متاح حتى اعتماد التخصيص الشهري.";

  // Whether an active plan is considered "activated" for this goal
  // (activePlan is app-wide; consider "activated" only if there is a monthly allocation.)
  const planActivated = monthly > 0;
  const activePlanText = !planActivated
    ? "لم يتم اعتماد خطة لهذا الهدف بعد."
    : activePlan.mode === "custom"
    ? `مخصصة (${activePlan.customMonths} شهر)`
    : "خطة الذكاء الاصطناعي";

  return (
    <section className="rounded-[28px] border border-outline bg-card p-6 shadow-card sm:p-8">
      {/* Header — goal + priority chip */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            تفاصيل الهدف المختار
          </p>
          <h3 className="mt-1 text-base font-bold text-ink sm:text-lg">{g.name}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                PRIORITY_META[g.priority].cls
              )}
            >
              الأولوية: {PRIORITY_META[g.priority].label}
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ok-light px-2 py-0.5 text-[10px] font-bold text-ok-dark">
                <CheckCircle2 className="h-3 w-3" />
                تم تحقيق الهدف
              </span>
            )}
          </div>
        </div>

        {/* Secondary actions — light, subtle */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setCompleted(g.id, !g.completed)}
            className="inline-flex items-center gap-1 rounded-lg border border-outline bg-card px-2.5 py-1 text-[11px] font-semibold text-ink-mute transition hover:border-ok/40 hover:text-ok-dark"
          >
            <BadgeCheck className="h-3 w-3" />
            {g.completed ? "إعادة التفعيل" : "وسمه مكتملاً"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `حذف الهدف "${g.name}"؟ سيتم إرجاع المبلغ المخصص إليه إلى الرصيد غير المخصص.`
                )
              ) {
                deleteGoal(g.id);
              }
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-outline bg-card px-2.5 py-1 text-[11px] font-semibold text-ink-mute transition hover:border-danger/40 hover:text-danger-dark"
          >
            <Trash2 className="h-3 w-3" />
            حذف
          </button>
        </div>
      </div>

      {/* 2-column grid of the 8 spec values */}
      <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <Row label="المبلغ المستهدف" value={formatSAR(g.targetPrice)} />
        <Row label="المخصص حالياً" value={formatSAR(g.allocated)} />
        <Row
          label="المبلغ المتبقي"
          value={isCompleted ? "تم تحقيق الهدف" : formatSAR(remainingAmount)}
          tone={isCompleted ? "ok" : undefined}
        />
        <Row
          label="التخصيص الشهري"
          value={monthlyText}
          tone={
            isCompleted
              ? "ok"
              : monthly > 0
              ? undefined
              : "muted"
          }
        />
        <Row
          label="المدة المتبقية"
          value={monthsText}
          tone={
            isCompleted
              ? "ok"
              : monthsRemaining !== null
              ? undefined
              : "muted"
          }
        />
        <Row
          label="الإنجاز المتوقع"
          value={expectedText}
          tone={
            isCompleted
              ? "ok"
              : monthsRemaining !== null
              ? undefined
              : "muted"
          }
        />
        <Row
          label="الأولوية"
          value={PRIORITY_META[g.priority].label}
        />
        <Row
          label="الخطة النشطة"
          value={activePlanText}
          tone={planActivated ? undefined : "muted"}
        />
      </dl>
    </section>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "muted";
}) {
  const valueClass =
    tone === "ok"
      ? "text-ok-dark"
      : tone === "muted"
      ? "text-ink-mute font-semibold"
      : "text-ink";
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
        {label}
      </dt>
      <dd className={cn("mt-1 text-sm font-bold", valueClass)}>{value}</dd>
    </div>
  );
}

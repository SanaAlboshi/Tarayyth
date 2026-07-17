import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bot, RefreshCw, Sparkles, Check, Edit3 } from "lucide-react";
import { Button } from "../../components/shared/Button";
import { cn, formatSAR } from "../../lib/format";
import { useGoals, GoalPriority } from "./goalsStore";
import { distributeAI } from "./aiAllocation";

const PRIORITY_META: Record<
  GoalPriority,
  { label: string; cls: string }
> = {
  high: { label: "عالية", cls: "bg-danger-light text-danger-dark" },
  medium: { label: "متوسطة", cls: "bg-warn-light text-warn-dark" },
  low: { label: "منخفضة", cls: "bg-primary-light text-primary-dark" },
};

export function AIAllocationSection() {
  const {
    goals,
    activeGoals,
    totals,
    editAllocation,
    editMonthlyAllocation,
    editPriority,
  } = useGoals();

  const [isEditing, setIsEditing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Current-savings distribution AI plan.
  const currentPlan = useMemo(
    () => distributeAI(totals.totalSavings, activeGoals, "current"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totals.totalSavings, activeGoals, refreshKey]
  );

  // Monthly capacity distribution AI plan.
  const monthlyPlan = useMemo(
    () => distributeAI(totals.monthlyCapacity, activeGoals, "monthly"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totals.monthlyCapacity, activeGoals, refreshKey]
  );

  // Local editable state (initialized from AI values).
  const [editCurrent, setEditCurrent] = useState<Record<string, number>>({});
  const [editMonthly, setEditMonthly] = useState<Record<string, number>>({});
  const [editPriorities, setEditPriorities] =
    useState<Record<string, GoalPriority>>({});

  useEffect(() => {
    // Sync local edit state whenever the AI plan changes.
    setEditCurrent(currentPlan.perGoal);
    setEditMonthly(monthlyPlan.perGoal);
    setEditPriorities(
      activeGoals.reduce<Record<string, GoalPriority>>((acc, g) => {
        acc[g.id] = g.priority;
        return acc;
      }, {})
    );
  }, [currentPlan.perGoal, monthlyPlan.perGoal, activeGoals]);

  const sumCurrent = Object.values(editCurrent).reduce(
    (s, v) => s + Math.max(0, v || 0),
    0
  );
  const sumMonthly = Object.values(editMonthly).reduce(
    (s, v) => s + Math.max(0, v || 0),
    0
  );

  const currentValid = sumCurrent <= totals.totalSavings;
  const monthlyValid = sumMonthly <= totals.monthlyCapacity;

  const acceptAI = () => {
    activeGoals.forEach((g) => {
      const cur = currentPlan.perGoal[g.id] ?? 0;
      const mon = monthlyPlan.perGoal[g.id] ?? 0;
      editAllocation(g.id, cur);
      editMonthlyAllocation(g.id, mon);
    });
    setIsEditing(false);
  };

  const saveEdits = () => {
    if (!currentValid || !monthlyValid) return;
    activeGoals.forEach((g) => {
      editAllocation(g.id, Math.max(0, Math.round(editCurrent[g.id] ?? 0)));
      editMonthlyAllocation(g.id, Math.max(0, Math.round(editMonthly[g.id] ?? 0)));
      const p = editPriorities[g.id];
      if (p && p !== g.priority) editPriority(g.id, p);
    });
    setIsEditing(false);
  };

  const recalculate = () => setRefreshKey((k) => k + 1);

  if (activeGoals.length === 0) {
    return (
      <section className="rounded-[28px] border border-outline bg-card p-6 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
          توزيع الذكاء الاصطناعي
        </p>
        <p className="mt-2 text-sm text-ink-mute">
          أضف هدفاً واحداً على الأقل ليقوم الذكاء الاصطناعي بتوزيع مدخراتك.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-outline bg-card p-6 shadow-card sm:p-8">
      {/* Header — title + subtitle only */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary-dark text-white shadow-card">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              التوزيع الموصى به من الذكاء الاصطناعي
            </p>
            <h3 className="mt-1 text-base font-bold text-ink sm:text-lg">
              رصيد واحد، توزيع ذكي على أهدافك
            </h3>
          </div>
        </div>
      </div>

      {/* Top actions — 3 clean actions, AI = primary gold */}
      <div className="mt-5 flex flex-wrap gap-2">
        {isEditing ? (
          <Button
            size="sm"
            variant="gold"
            onClick={saveEdits}
            disabled={!currentValid || !monthlyValid}
            icon={<Check className="h-3.5 w-3.5" />}
          >
            حفظ التعديلات
          </Button>
        ) : (
          <Button
            size="sm"
            variant="gold"
            onClick={acceptAI}
            icon={<Sparkles className="h-3.5 w-3.5" />}
          >
            قبول التوزيع الذكي
          </Button>
        )}
        {!isEditing && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            icon={<Edit3 className="h-3.5 w-3.5" />}
          >
            تعديل التوزيع
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={recalculate}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          إعادة الحساب
        </Button>
      </div>

      {/* Validity error — muted unless triggered */}
      {(!currentValid || !monthlyValid) && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger-light p-2.5 text-[11px] text-danger-dark">
          {!currentValid && "مجموع التوزيع الحالي يتجاوز إجمالي المدخرات. "}
          {!monthlyValid && "مجموع التوزيع الشهري يتجاوز القدرة الشهرية."}
        </div>
      )}

      {/* Compact per-goal list */}
      <ul className="mt-5 divide-y divide-outline overflow-hidden rounded-2xl border border-outline">
        {activeGoals.map((g) => {
          const cur = isEditing ? editCurrent[g.id] ?? 0 : currentPlan.perGoal[g.id] ?? 0;
          const mon = isEditing ? editMonthly[g.id] ?? 0 : monthlyPlan.perGoal[g.id] ?? 0;
          const pri = isEditing ? editPriorities[g.id] ?? g.priority : g.priority;
          const isTop = currentPlan.topGoalId === g.id;
          const isCompleted = g.allocated >= g.targetPrice;
          const remaining = Math.max(0, g.targetPrice - g.allocated);
          // Estimated remaining duration for this specific goal, based on its own monthly allocation.
          const months =
            isCompleted
              ? 0
              : mon > 0
              ? Math.ceil(remaining / mon)
              : null;
          const durationLabel = isCompleted
            ? "تم تحقيق الهدف"
            : months !== null
            ? `${months} شهر`
            : "المدة غير متاحة حتى اعتماد التخصيص الشهري";

          return (
            <li key={g.id} className="bg-card p-4 sm:p-5">
              {/* Row header — name + top badge + priority */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-ink">{g.name}</p>
                  {isTop && !isCompleted && (
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold text-primary-dark">
                      أعلى أولوية
                    </span>
                  )}
                  {isCompleted && (
                    <span className="rounded-full bg-ok-light px-2 py-0.5 text-[10px] font-bold text-ok-dark">
                      مكتمل
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <select
                    value={pri}
                    onChange={(e) =>
                      setEditPriorities((prev) => ({
                        ...prev,
                        [g.id]: e.target.value as GoalPriority,
                      }))
                    }
                    className="rounded-lg border border-outline bg-card px-2 py-1 text-xs font-bold"
                  >
                    <option value="high">عالية</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                      PRIORITY_META[pri].cls
                    )}
                  >
                    الأولوية: {PRIORITY_META[pri].label}
                  </span>
                )}
              </div>

              {/* Row facts — 3 mini columns */}
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <FactRow label="المخصص حالياً">
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={cur || ""}
                      onChange={(e) =>
                        setEditCurrent((prev) => ({
                          ...prev,
                          [g.id]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-full rounded-lg border border-outline bg-card px-2 py-1 text-sm font-bold text-ink focus:border-primary focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm font-bold text-ink">{formatSAR(cur)}</span>
                  )}
                </FactRow>
                <FactRow label={isCompleted ? "التخصيص الشهري" : "التخصيص الشهري المقترح"}>
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={mon || ""}
                      onChange={(e) =>
                        setEditMonthly((prev) => ({
                          ...prev,
                          [g.id]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-full rounded-lg border border-outline bg-card px-2 py-1 text-sm font-bold text-ink focus:border-primary focus:outline-none"
                    />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-bold",
                        isCompleted ? "text-ok-dark" : "text-ink"
                      )}
                    >
                      {isCompleted ? "متوقف" : formatSAR(mon)}
                    </span>
                  )}
                </FactRow>
                <FactRow
                  label={
                    isCompleted
                      ? "الحالة"
                      : months !== null
                      ? "المدة المقترحة"
                      : "المدة"
                  }
                >
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isCompleted
                        ? "text-ok-dark"
                        : months === null
                        ? "text-warn-dark"
                        : "text-ink"
                    )}
                  >
                    {durationLabel}
                  </span>
                </FactRow>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Single 2-line reason */}
      <motion.p
        key={currentPlan.reason + monthlyPlan.reason}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 line-clamp-2 rounded-2xl border border-primary/20 bg-primary-light/40 p-3 text-xs leading-relaxed text-primary-dark"
      >
        {currentPlan.reason}
      </motion.p>

      {/* Distribution validity totals — small, single line, subtle */}
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-mute">
        <span>
          الحالي:{" "}
          <span
            className={cn(
              "font-bold",
              currentValid ? "text-ink" : "text-danger-dark"
            )}
          >
            {formatSAR(sumCurrent)} من {formatSAR(totals.totalSavings)}
          </span>
        </span>
        <span>
          الشهري:{" "}
          <span
            className={cn(
              "font-bold",
              monthlyValid ? "text-ink" : "text-danger-dark"
            )}
          >
            {formatSAR(sumMonthly)} من {formatSAR(totals.monthlyCapacity)}
          </span>
        </span>
      </p>

      {goals.some((g) => g.completed) && (
        <p className="mt-2 text-[11px] text-ink-mute">
          الأهداف المكتملة موقوفة من التوزيع التلقائي.
        </p>
      )}
    </section>
  );
}

function FactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-outline bg-surface-alt/40 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

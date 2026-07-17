import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { cn } from "../../lib/format";
import { useGoals } from "./goalsStore";
import { AddGoalModal } from "./AddGoalModal";

export function GoalSelector() {
  const { goals, activeGoalId, selectGoal } = useGoals();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="rounded-[28px] border border-outline bg-card p-5 shadow-card sm:p-6">
      {/* Header — label only (no duplicate Add Goal button here) */}
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Target className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            أهدافي المالية
          </p>
          <p className="text-xs text-ink-mute">اختر هدفاً لعرض خطته أو أضف هدفاً جديداً.</p>
        </div>
      </div>

      {/* Chips row — active goals + ONE Add Goal chip */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {goals.length === 0 ? (
          <p className="text-xs text-ink-mute">
            لا توجد أهداف بعد — ابدأ بإضافة هدفك الأول.
          </p>
        ) : (
          goals.map((g) => {
            const isActive = g.id === activeGoalId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGoal(g.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition",
                  isActive
                    ? "border-primary bg-primary text-white shadow-card"
                    : "border-outline bg-card text-ink hover:border-primary/40 hover:text-primary"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isActive ? "bg-white" : "bg-primary"
                  )}
                />
                {g.name}
                {isActive && (
                  <span className="text-[10px] font-semibold text-white/85">نشط</span>
                )}
              </button>
            );
          })
        )}

        {/* The single Add Goal entry point */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 bg-primary-light/30 px-4 py-1.5 text-xs font-bold text-primary-dark transition hover:border-primary hover:bg-primary-light"
        >
          <Plus className="h-3 w-3" />
          إضافة هدف
        </button>
      </div>

      {/* Modal */}
      <AddGoalModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}

import { Link } from "react-router-dom";
import { CalendarCheck, CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "../../components/shared/Button";
import { cn } from "../../lib/format";
import { useCheckin } from "./checkinStore";

/** Arabic day wording (dual + plural rules). Positive integer expected. */
function daysWord(n: number): string {
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومين";
  if (n >= 3 && n <= 10) return `${n} أيام`;
  return `${n} يوماً`;
}

export function MonthlyUpdateStatusCard() {
  const { monthlyStatus } = useCheckin();
  const { state, daysDisplay, completedMonthLabel, nextInDays } = monthlyStatus;

  // ---- STATE 4: COMPLETED ----
  if (state === "completed") {
    return (
      <section className="rounded-2xl border border-outline bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ok-light text-ok-dark">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ok-dark">
                التحديث الشهري
              </p>
              <p className="mt-1 text-sm font-bold text-ink">
                تم تحديث شهر {completedMonthLabel ?? "هذا"} ✓
              </p>
              <p className="mt-0.5 text-xs text-ink-mute">
                {nextInDays > 0
                  ? `التحديث القادم بعد ${daysWord(nextInDays)}`
                  : "التحديث القادم قريباً"}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ---- STATE 2 & 3: DUE / OVERDUE (active) ----
  if (state === "due" || state === "overdue") {
    const isOverdue = state === "overdue";
    return (
      <section
        className={cn(
          "rounded-2xl border p-5",
          isOverdue
            ? "border-warn/30 bg-warn-light/60"
            : "border-ok/30 bg-ok-light/60"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                isOverdue ? "bg-warn text-white" : "bg-ok text-white"
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CalendarCheck className="h-4 w-4" />
              )}
            </span>
            <div>
              <p
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-widest",
                  isOverdue ? "text-warn-dark" : "text-ok-dark"
                )}
              >
                التحديث الشهري
              </p>
              <p
                className={cn(
                  "mt-1 text-sm font-bold",
                  isOverdue ? "text-warn-dark" : "text-ok-dark"
                )}
              >
                {isOverdue
                  ? `التحديث متأخر منذ ${daysWord(daysDisplay)}`
                  : "حان وقت تحديث ادخارك"}
              </p>
            </div>
          </div>

          <Link to="/app/checkin">
            <Button
              size="sm"
              variant={isOverdue ? "primary" : "gold"}
              icon={<CalendarCheck className="h-3.5 w-3.5" />}
            >
              حدّث الآن
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  // ---- STATE 1: BEFORE DUE ----
  return (
    <section className="rounded-2xl border border-outline bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-mute">
          <CalendarClock className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
            التحديث الشهري
          </p>
          <p className="mt-1 text-sm font-bold text-ink">التحديث القادم</p>
          <p className="mt-0.5 text-xs text-ink-mute">بعد {daysWord(daysDisplay)}</p>
        </div>
      </div>
    </section>
  );
}

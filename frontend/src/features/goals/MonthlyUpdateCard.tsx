import { Link } from "react-router-dom";
import { CalendarCheck, ArrowUpRight } from "lucide-react";
import { Button } from "../../components/shared/Button";

/**
 * Compact card that connects the Savings Plan page to the Monthly Check-in
 * flow: explains what happens each month + one clear action to open the
 * existing check-in experience.
 */
export function MonthlyUpdateCard() {
  return (
    <section className="rounded-2xl border border-outline bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              التحديث الشهري
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft sm:text-sm">
              كل شهر، سجّل المبلغ الذي ادخرته فعلياً. سيقترح الذكاء الاصطناعي توزيعه بين أهدافك،
              ثم يعيد حساب نسبة الإنجاز والمدة المتبقية تلقائياً.
            </p>
          </div>
        </div>

        <Link to="/app/checkin" className="shrink-0">
          <Button size="sm" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>
            تحديث هذا الشهر
          </Button>
        </Link>
      </div>
    </section>
  );
}

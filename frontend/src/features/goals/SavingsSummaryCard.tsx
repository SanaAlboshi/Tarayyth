import { cn, formatSAR } from "../../lib/format";
import { useGoals } from "./goalsStore";

/**
 * Compact page-level summary of the single savings pool: total, allocated,
 * unallocated, monthly capacity. Used on the Smart Savings Plan page above
 * the AI Allocation section so that pool totals are shown only once.
 */
export function SavingsSummaryCard() {
  const { totals } = useGoals();

  return (
    <section className="rounded-2xl border border-outline bg-card p-5 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
        ملخص المدخرات
      </p>
      <div className="mt-3 grid grid-cols-2 divide-x divide-outline sm:grid-cols-4 rtl:divide-x-reverse">
        <Cell label="إجمالي المدخرات" value={formatSAR(totals.totalSavings)} />
        <Cell label="المخصّص" value={formatSAR(totals.totalAllocated)} tone="primary" />
        <Cell
          label="غير مخصّص"
          value={formatSAR(totals.unallocated)}
          tone={totals.unallocated > 0 ? "accent" : "muted"}
        />
        <Cell label="القدرة الشهرية" value={formatSAR(totals.monthlyCapacity)} />
      </div>
    </section>
  );
}

function Cell({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary" | "accent" | "muted";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary-dark"
      : tone === "accent"
      ? "text-accent-dark"
      : "text-ink";
  return (
    <div className="px-3 py-1 first:pr-0 last:pl-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
        {label}
      </p>
      <p className={cn("mt-0.5 truncate text-sm font-bold", toneClass)}>{value}</p>
    </div>
  );
}

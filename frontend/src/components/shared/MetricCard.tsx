import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/format";

interface Props {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "gold" | "ok" | "warn" | "danger" | "info";
  progress?: number;
  delta?: string;
  className?: string;
}

const toneStyles = {
  primary: "from-primary/10 to-primary-light text-primary",
  gold: "from-accent/10 to-accent-light text-accent-dark",
  ok: "from-ok/10 to-ok-light text-ok-dark",
  warn: "from-warn/10 to-warn-light text-warn-dark",
  danger: "from-danger/10 to-danger-light text-danger-dark",
  info: "from-info/10 to-info-light text-info",
};

export function MetricCard({
  icon,
  label,
  value,
  hint,
  tone = "primary",
  progress,
  delta,
  className,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-outline bg-card p-5 shadow-card",
        className
      )}
    >
      <div
        className={cn(
          "absolute -left-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-tr opacity-70",
          toneStyles[tone]
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-mute">
            {label}
          </span>
          <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr",
            toneStyles[tone]
          )}
        >
          {icon}
        </div>
      </div>
      {typeof progress === "number" && (
        <div className="relative mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline/70">
            <div
              className="h-full rounded-full bg-gradient-to-l from-primary to-primary-dark"
              style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
            />
          </div>
          {delta && <span className="mt-2 block text-[11px] text-ink-mute">{delta}</span>}
        </div>
      )}
    </motion.div>
  );
}

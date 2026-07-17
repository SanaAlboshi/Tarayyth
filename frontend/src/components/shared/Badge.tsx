import { ReactNode } from "react";
import { cn } from "../../lib/format";

type Tone = "primary" | "ok" | "warn" | "danger" | "info" | "neutral" | "gold";

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary-light text-primary-dark",
  ok: "bg-ok-light text-ok-dark",
  warn: "bg-warn-light text-warn-dark",
  danger: "bg-danger-light text-danger-dark",
  info: "bg-info-light text-info",
  neutral: "bg-surface-alt text-ink-soft",
  gold: "bg-accent-light text-accent-dark",
};

export function Badge({
  tone = "neutral",
  children,
  icon,
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
        toneClasses[tone]
      )}
    >
      {icon}
      {children}
    </span>
  );
}

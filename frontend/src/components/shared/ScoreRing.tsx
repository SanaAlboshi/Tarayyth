import { motion } from "framer-motion";
import { cn } from "../../lib/format";

interface Props {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: "primary" | "gold" | "ok" | "warn" | "danger";
  hint?: string;
}

const toneColor = {
  primary: "#0E6E5C",
  gold: "#C98A3E",
  ok: "#12805F",
  warn: "#C9862F",
  danger: "#B3413A",
};

export function ScoreRing({
  value,
  size = 148,
  stroke = 12,
  label = "الجاهزية المالية",
  tone,
  hint,
}: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const inferred: "ok" | "primary" | "warn" | "danger" | "gold" =
    tone ?? (clamped >= 75 ? "ok" : clamped >= 55 ? "primary" : clamped >= 35 ? "warn" : "danger");
  const color = toneColor[inferred];
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke="#E4E1D9"
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke={color}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold")} style={{ color }}>
            {Math.round(clamped)}
          </span>
          <span className="text-[10px] font-semibold text-ink-mute">من 100</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-ink-mute">{hint}</p>}
      </div>
    </div>
  );
}

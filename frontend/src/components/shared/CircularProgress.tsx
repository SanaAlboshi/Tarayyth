import { motion } from "framer-motion";
import { cn } from "../../lib/format";

// Tier by percent: 0–40 danger, 41–70 warn, 71–100 ok.
// Kept identical to the Savings Plan card so the ring color logic matches.
export type CircularProgressTier = "danger" | "warn" | "ok";

export function tierOfPercent(pct: number): CircularProgressTier {
  if (pct <= 40) return "danger";
  if (pct <= 70) return "warn";
  return "ok";
}

// Palette hex values — must stay in the existing palette.
const RING_COLOR: Record<CircularProgressTier, string> = {
  danger: "#B3413A",
  warn: "#C9862F",
  ok: "#12805F",
};

const RING_TEXT: Record<CircularProgressTier, string> = {
  danger: "text-danger-dark",
  warn: "text-warn-dark",
  ok: "text-ok-dark",
};

interface Props {
  value: number;
  tier: CircularProgressTier;
  /** Small caption inside the circle, below the percentage. */
  sublabel?: string;
}

export function CircularProgress({ value, tier, sublabel = "نسبة الإنجاز" }: Props) {
  const size = 200;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100);
  const color = RING_COLOR[tier];

  return (
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
        <span className={cn("text-5xl font-bold leading-none", RING_TEXT[tier])}>
          {Math.round(value)}
          <span className="text-xl font-semibold text-ink-mute">%</span>
        </span>
        {sublabel && (
          <span className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-mute">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

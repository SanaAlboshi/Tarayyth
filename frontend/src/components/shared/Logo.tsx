import { cn } from "../../lib/format";

interface Props {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
  showText?: boolean;
}

export function Logo({ size = "md", variant = "dark", showText = true }: Props) {
  const dims = {
    sm: "h-9 w-9 text-sm",
    md: "h-11 w-11 text-lg",
    lg: "h-14 w-14 text-2xl",
  }[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-2xl font-bold text-white",
          dims
        )}
        style={{
          background: "linear-gradient(135deg, #02151E 0%, #002134 100%)",
          boxShadow:
            "0 1px 2px rgba(2,21,30,0.10), 0 8px 20px rgba(2,21,30,0.20)",
        }}
      >
        {/* Subtle top gloss for a premium finish */}
        <span
          className="absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 100%)",
          }}
          aria-hidden="true"
        />
        {/* Coral accent hairline — replaces the old green highlight */}
        <span
          className="absolute bottom-0 right-2 left-2 h-px"
          style={{ backgroundColor: "#D58D79", opacity: 0.9 }}
          aria-hidden="true"
        />
        <span className="relative">ت</span>
      </div>
      {showText && (
        <div className="leading-tight">
          <p
            className={cn(
              "text-sm font-bold tracking-tight",
              variant === "light" ? "text-white" : "text-ink"
            )}
          >
            تريّث
          </p>
          <p
            className={cn(
              "text-[10px] font-medium tracking-wider",
              variant === "light" ? "text-white/70" : "text-ink-mute"
            )}
          >
            TRAYYATH
          </p>
        </div>
      )}
    </div>
  );
}

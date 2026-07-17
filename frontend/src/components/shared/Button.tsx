import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/format";

type Variant = "primary" | "outline" | "ghost" | "danger" | "gold";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-card",
  outline: "border border-outline bg-card text-ink hover:border-primary/50 hover:text-primary",
  ghost: "bg-transparent text-ink hover:bg-primary-light/60",
  danger: "bg-danger text-white hover:bg-danger-dark",
  gold: "bg-gradient-to-tr from-accent to-gold text-white shadow-card hover:brightness-110",
};

const sizeClasses = {
  sm: "px-3 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  icon,
  loading,
  fullWidth,
  size = "md",
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-b-transparent" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </button>
  );
}

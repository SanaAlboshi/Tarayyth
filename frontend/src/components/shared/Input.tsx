import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "../../lib/format";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, hint, error, icon, suffix, className, ...rest }, ref) => {
    return (
      <label className="block">
        {label && <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>}
        <div
          className={cn(
            "relative flex items-center rounded-xl border bg-card transition",
            error
              ? "border-danger focus-within:ring-4 focus-within:ring-danger/10"
              : "border-outline focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
          )}
        >
          {icon && <span className="pr-3 text-ink-mute">{icon}</span>}
          <input
            ref={ref}
            {...rest}
            className={cn(
              "w-full bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-mute focus:outline-none",
              icon ? "pr-0" : "",
              className
            )}
          />
          {suffix && <span className="pl-3 text-xs text-ink-mute">{suffix}</span>}
        </div>
        {(hint || error) && (
          <span className={cn("mt-1 block text-[11px]", error ? "text-danger" : "text-ink-mute")}>
            {error ?? hint}
          </span>
        )}
      </label>
    );
  }
);
Input.displayName = "Input";

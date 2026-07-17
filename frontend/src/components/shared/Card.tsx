import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/format";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ padded = true, elevated, className, children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-2xl border border-outline bg-card",
        elevated ? "shadow-elevated" : "shadow-card",
        padded && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

interface HeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, subtitle, action, icon }: HeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-mute">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

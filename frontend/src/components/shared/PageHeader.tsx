import { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions, icon }: Props) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
            {icon}
          </div>
        )}
        <div>
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-3xl">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

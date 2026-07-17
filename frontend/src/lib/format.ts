export const formatSAR = (v: number): string => {
  if (!Number.isFinite(v)) return "0 ر.س";
  const abs = Math.abs(v);
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(v));
  return `${formatted} ر.س`;
};

export const formatNumber = (v: number, digits = 0): string => {
  if (!Number.isFinite(v)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v);
};

export const formatPercent = (v: number): string => `${Math.round(v)}%`;

export const formatDate = (d: string | Date): string => {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (d: string | Date): string => {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const relativeTime = (d: string | Date): string => {
  const date = typeof d === "string" ? new Date(d) : d;
  const diffSec = (Date.now() - date.getTime()) / 1000;
  if (diffSec < 60) return "الآن";
  if (diffSec < 3600) return `قبل ${Math.floor(diffSec / 60)} دقيقة`;
  if (diffSec < 86400) return `قبل ${Math.floor(diffSec / 3600)} ساعة`;
  if (diffSec < 604800) return `قبل ${Math.floor(diffSec / 86400)} يوم`;
  return formatDate(date);
};

export const scoreTone = (score: number) => {
  if (score >= 75) return { text: "text-ok-dark", bg: "bg-ok-light", ring: "ring-ok/20" };
  if (score >= 55) return { text: "text-primary-dark", bg: "bg-primary-light", ring: "ring-primary/20" };
  if (score >= 35) return { text: "text-warn-dark", bg: "bg-warn-light", ring: "ring-warn/20" };
  return { text: "text-danger-dark", bg: "bg-danger-light", ring: "ring-danger/20" };
};

export const riskTone = (level: string) => {
  switch (level) {
    case "منخفض":
      return "bg-ok-light text-ok-dark";
    case "متوسط":
      return "bg-primary-light text-primary-dark";
    case "مرتفع":
      return "bg-warn-light text-warn-dark";
    case "حرج":
      return "bg-danger-light text-danger-dark";
    default:
      return "bg-outline/50 text-ink-soft";
  }
};

export const cn = (...classes: unknown[]): string =>
  classes.filter((c): c is string => typeof c === "string" && c.length > 0).join(" ");

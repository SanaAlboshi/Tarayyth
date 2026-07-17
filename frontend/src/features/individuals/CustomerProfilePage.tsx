import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  IdCard,
  Wallet,
  PiggyBank,
  Save,
  Moon,
  Sun,
  Bell,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { useAuth } from "../auth/authStore";
import { useTheme } from "../theme/themeStore";
import { formatDate } from "../../lib/format";

/* ------------------------------------------------------------------ */
/* Bank palette (Profile page only — re-skin)                          */
/* ------------------------------------------------------------------ */

const BANK = {
  paper:    "#fcf8f5",
  ink:      "#02151e",
  inkAlt:   "#002134",
  muted:    "#3f3c3e",
  accent:   "#d58d79",
  ai:       "#837fd8",
  paperEdge:"#EDE7DE",
} as const;

interface ProfileForm {
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  monthlySalary: number;
  optionalSavings: number;
}

export function CustomerProfilePage() {
  const { user, updateProfile } = useAuth();
  const { theme, toggle } = useTheme();

  if (!user) return null;

  const { register, handleSubmit, formState } = useForm<ProfileForm>({
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      nationalId: user.nationalId,
      monthlySalary: user.monthlySalary,
      optionalSavings: user.optionalSavings,
    },
  });

  const onSubmit = handleSubmit((data) => {
    updateProfile({
      ...data,
      monthlySalary: Number(data.monthlySalary),
      optionalSavings: Number(data.optionalSavings),
    });
  });

  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("");

  return (
    <div>
      {/* Page header — matches other redesigned pages */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BANK.muted }}
          >
            الملف الشخصي
          </p>
          <h1
            className="mt-1 text-2xl font-bold tracking-tight md:text-3xl"
            style={{ color: BANK.ink }}
          >
            إدارة الملف الشخصي
          </h1>
          <p className="mt-1.5 max-w-lg text-sm" style={{ color: BANK.muted }}>
            حدّث بياناتك الشخصية وإعدادات المنصة.
          </p>
        </div>
      </div>

      {/* Coral focus utility (applies only inside this page). */}
      <style>{`
        .bank-input:focus-within {
          border-color: ${BANK.accent} !important;
          box-shadow: 0 0 0 4px rgba(213,141,121,0.15);
        }
      `}</style>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: profile card + settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 lg:col-span-1"
        >
          {/* Profile card */}
          <section
            className="rounded-3xl p-8 shadow-card"
            style={{
              backgroundColor: "#FFFFFF",
              border: `1px solid ${BANK.paperEdge}`,
            }}
          >
            <div className="flex flex-col items-center text-center">
              {/* Avatar with soft coral glow */}
              <div className="relative">
                <div
                  className="pointer-events-none absolute inset-0 -m-4 rounded-full blur-2xl"
                  style={{ backgroundColor: "rgba(213,141,121,0.28)" }}
                  aria-hidden="true"
                />
                <div
                  className="relative flex h-24 w-24 items-center justify-center rounded-3xl text-2xl font-bold text-white shadow-elevated"
                  style={{
                    background: `linear-gradient(135deg, ${BANK.ink} 0%, ${BANK.inkAlt} 100%)`,
                  }}
                >
                  {initials}
                </div>
              </div>

              <h3
                className="mt-6 text-lg font-bold tracking-tight sm:text-xl"
                style={{ color: BANK.ink }}
              >
                {user.fullName}
              </h3>
              <p className="mt-1 text-xs" style={{ color: BANK.muted }}>
                {user.email}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: BANK.muted, opacity: 0.7 }}>
                عضو منذ {formatDate(user.createdAt)}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <SoftBadge
                  bg="rgba(0,33,52,0.08)"
                  color={BANK.inkAlt}
                  label="حساب شخصي"
                />
              </div>
            </div>
          </section>

          {/* Settings card */}
          <section
            className="rounded-3xl p-6 shadow-card"
            style={{
              backgroundColor: "#FFFFFF",
              border: `1px solid ${BANK.paperEdge}`,
            }}
          >
            <div className="mb-5 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${BANK.accent}18`,
                  color: BANK.inkAlt,
                }}
              >
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: BANK.muted }}
                >
                  الإعدادات
                </p>
                <h3
                  className="text-base font-bold"
                  style={{ color: BANK.ink }}
                >
                  إعدادات المنصة
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              <SettingRow
                icon={
                  theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )
                }
                title="الوضع الليلي"
                description="تحكم بمظهر المنصة"
                action={<ToggleSwitch on={theme === "dark"} onClick={toggle} />}
              />
              <SettingRow
                icon={<Bell className="h-4 w-4" />}
                title="الإشعارات"
                description="تنبيهات فورية"
                action={
                  <SoftBadge
                    bg="rgba(184,219,203,0.35)"
                    color="#0A5A42"
                    label="مفعّل"
                  />
                }
              />
              <SettingRow
                icon={<Globe className="h-4 w-4" />}
                title="اللغة"
                description="العربية / RTL"
                action={
                  <SoftBadge
                    bg="rgba(0,33,52,0.08)"
                    color={BANK.inkAlt}
                    label="العربية"
                  />
                }
              />
              <SettingRow
                icon={<ShieldCheck className="h-4 w-4" />}
                title="الأمان"
                description="مصادقة ثنائية"
                action={
                  <SoftBadge
                    bg="rgba(131,127,216,0.16)"
                    color={BANK.ai}
                    label="قريباً"
                  />
                }
              />
            </div>
          </section>
        </motion.div>

        {/* Right column: Personal information */}
        <form onSubmit={onSubmit} className="lg:col-span-2">
          <section
            className="rounded-3xl p-6 shadow-card sm:p-8"
            style={{
              backgroundColor: "#FFFFFF",
              border: `1px solid ${BANK.paperEdge}`,
            }}
          >
            <div className="mb-6 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${BANK.accent}18`,
                  color: BANK.inkAlt,
                }}
              >
                <User className="h-4 w-4" />
              </span>
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: BANK.muted }}
                >
                  البيانات
                </p>
                <h3 className="text-base font-bold" style={{ color: BANK.ink }}>
                  البيانات الشخصية
                </h3>
                <p className="text-xs" style={{ color: BANK.muted }}>
                  حدّث معلوماتك
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <BankInput
                label="الاسم الكامل"
                icon={<User className="h-4 w-4" />}
                {...register("fullName", { required: true })}
              />
              <BankInput
                label="رقم الهوية"
                icon={<IdCard className="h-4 w-4" />}
                {...register("nationalId", { required: true })}
              />
              <BankInput
                label="البريد الإلكتروني"
                type="email"
                icon={<Mail className="h-4 w-4" />}
                {...register("email", { required: true })}
              />
              <BankInput
                label="رقم الجوال"
                icon={<Phone className="h-4 w-4" />}
                {...register("phone", { required: true })}
              />
              <BankInput
                label="الراتب الشهري"
                type="number"
                icon={<Wallet className="h-4 w-4" />}
                suffix="ر.س"
                {...register("monthlySalary", { valueAsNumber: true })}
              />
              <BankInput
                label="المدخرات الاختيارية"
                type="number"
                icon={<PiggyBank className="h-4 w-4" />}
                suffix="ر.س"
                {...register("optionalSavings", { valueAsNumber: true })}
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={formState.isSubmitting}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-card transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: BANK.accent }}
              >
                {formState.isSubmitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-b-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                حفظ التغييرات
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bank-styled input (matches shared Input API for this page)          */
/* ------------------------------------------------------------------ */

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

interface BankInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

const BankInput = forwardRef<HTMLInputElement, BankInputProps>(
  ({ label, icon, suffix, className, ...rest }, ref) => {
    return (
      <label className="block">
        {label && (
          <span
            className="mb-2 block text-xs font-semibold"
            style={{ color: BANK.muted }}
          >
            {label}
          </span>
        )}
        <div
          className="bank-input flex items-center gap-2 rounded-2xl px-4 transition"
          style={{
            height: 52,
            backgroundColor: BANK.paper,
            border: `1px solid ${BANK.paperEdge}`,
          }}
        >
          {icon && (
            <span style={{ color: BANK.muted }} className="flex-shrink-0">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            {...rest}
            className={`w-full bg-transparent text-sm font-medium tabular-nums placeholder:text-[#9A928A] focus:outline-none ${className ?? ""}`}
            style={{ color: BANK.ink }}
          />
          {suffix && (
            <span
              className="flex-shrink-0 text-xs font-semibold"
              style={{ color: BANK.muted }}
            >
              {suffix}
            </span>
          )}
        </div>
      </label>
    );
  }
);
BankInput.displayName = "BankInput";

/* ------------------------------------------------------------------ */
/* Setting row                                                          */
/* ------------------------------------------------------------------ */

function SettingRow({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-2xl px-4 py-3.5 transition-colors duration-200 hover:bg-black/[0.02]"
      style={{ border: `1px solid ${BANK.paperEdge}` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: `${BANK.accent}14`,
            color: BANK.inkAlt,
          }}
        >
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: BANK.ink }}>
            {title}
          </p>
          <p
            className="mt-0.5 text-[11px]"
            style={{ color: BANK.muted, opacity: 0.85 }}
          >
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle switch (light gray → coral)                                   */
/* ------------------------------------------------------------------ */

function ToggleSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200"
      style={{
        backgroundColor: on ? BANK.accent : "#D6D0C8",
      }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
        style={{
          right: on ? "2px" : "22px",
        }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Small soft pastel badge                                              */
/* ------------------------------------------------------------------ */

function SoftBadge({
  bg,
  color,
  label,
}: {
  bg: string;
  color: string;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold leading-none"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}

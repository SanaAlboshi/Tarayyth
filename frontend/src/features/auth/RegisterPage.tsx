import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  Mail,
  Phone,
  IdCard,
  User,
  Lock,
  Wallet,
  PiggyBank,
  ShieldCheck,
  Eye,
  EyeOff,
  BarChart2,
  Target,
} from "lucide-react";
import { Logo } from "../../components/shared/Logo";
import { useAuth } from "./authStore";

/* ------------------------------------------------------------------ */
/* Bank palette (Register page only)                                   */
/* ------------------------------------------------------------------ */

const BANK = {
  paper:    "#FCF8F5",
  ink:      "#02151E",
  inkAlt:   "#002134",
  muted:    "#3F3C3E",
  accent:   "#D58D79",
  ai:       "#837FD8",
  paperEdge:"#EDE7DE",
} as const;

interface FormValues {
  fullName: string;
  nationalId: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  monthlySalary: number;
  optionalSavings: number;
}

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const submit = handleSubmit(async (data) => {
    setError(null);
    if (data.password !== data.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setLoading(true);
    try {
      await registerUser(
        {
          fullName: data.fullName,
          nationalId: data.nationalId,
          email: data.email,
          phone: data.phone,
          monthlySalary: Number(data.monthlySalary),
          optionalSavings: Number(data.optionalSavings || 0),
        },
        data.password
      );
      navigate("/app/financial-analysis");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إنشاء الحساب.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: BANK.paper }}
    >
      {/* Decorative background — same language as the Login page */}
      <DecorativeBackground />

      {/* Scoped coral focus + subtle card float — matches Login page */}
      <style>{`
        .reg-input:focus-within {
          border-color: ${BANK.accent} !important;
          box-shadow: 0 0 0 4px rgba(213,141,121,0.15);
        }
        .feature-card {
          transition: transform 400ms ease, box-shadow 400ms ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(2,21,30,0.10);
        }
        .cta-btn {
          transition: background-color 200ms ease, transform 200ms ease, box-shadow 200ms ease;
        }
        .cta-btn:hover:not(:disabled) {
          background-color: ${BANK.ink} !important;
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(2,21,30,0.25);
        }
      `}</style>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-6 pt-6 sm:px-10 sm:pt-8">
        {/* Top strip */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition hover:opacity-80"
            style={{ color: BANK.muted }}
          >
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            العودة للرئيسية
          </Link>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: BANK.muted }}
          >
            إنشاء حساب
          </span>
        </div>

        {/* Two-column grid */}
        <div className="flex flex-1 items-center py-10">
          <div className="grid w-full items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)] lg:gap-16">
            {/* -------- LEFT: brand experience -------- */}
            <BrandExperience />

            {/* -------- RIGHT: Register card -------- */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              className="mx-auto w-full max-w-[620px]"
            >
              <div
                className="p-8 sm:p-10"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 30,
                  border: `1px solid ${BANK.paperEdge}`,
                  boxShadow:
                    "0 1px 2px rgba(2,21,30,0.04), 0 30px 60px rgba(2,21,30,0.10)",
                }}
              >
                {/* Card top */}
                <div className="text-center">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em]"
                    style={{
                      backgroundColor: `${BANK.accent}18`,
                      color: BANK.accent,
                    }}
                  >
                    إنشاء حساب جديد
                  </span>
                  <h2
                    className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl"
                    style={{ color: BANK.ink }}
                  >
                    ابدأ رحلتك المالية
                  </h2>
                  <p
                    className="mt-2 max-w-md mx-auto text-sm leading-relaxed"
                    style={{ color: BANK.muted }}
                  >
                    أدخل بياناتك الأساسية لإنشاء حسابك والبدء في بناء خطتك المالية.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="mt-8 space-y-8" noValidate>
                  {/* Section 1 — Personal info */}
                  <FormSection title="المعلومات الشخصية">
                    <PremiumField
                      label="الاسم الكامل"
                      icon={<User className="h-4 w-4" />}
                      error={errors.fullName ? "الاسم الكامل مطلوب." : undefined}
                    >
                      <input
                        type="text"
                        autoComplete="name"
                        placeholder="أحمد بن سالم"
                        {...register("fullName", { required: true })}
                        className="w-full bg-transparent text-sm font-medium focus:outline-none"
                        style={{ color: BANK.ink }}
                      />
                    </PremiumField>
                    <PremiumField
                      label="رقم الهوية الوطنية"
                      icon={<IdCard className="h-4 w-4" />}
                      error={errors.nationalId ? "رقم الهوية مطلوب." : undefined}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="10XXXXXXXX"
                        {...register("nationalId", { required: true })}
                        className="w-full bg-transparent text-sm font-medium tabular-nums focus:outline-none"
                        style={{ color: BANK.ink }}
                      />
                    </PremiumField>
                    <PremiumField
                      label="البريد الإلكتروني"
                      icon={<Mail className="h-4 w-4" />}
                      error={errors.email ? "البريد الإلكتروني مطلوب." : undefined}
                    >
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...register("email", { required: true })}
                        className="w-full bg-transparent text-sm font-medium focus:outline-none"
                        style={{ color: BANK.ink }}
                      />
                    </PremiumField>
                    <PremiumField
                      label="رقم الجوال"
                      icon={<Phone className="h-4 w-4" />}
                      error={errors.phone ? "رقم الجوال مطلوب." : undefined}
                    >
                      <input
                        type="tel"
                        autoComplete="tel"
                        placeholder="05XXXXXXXX"
                        {...register("phone", { required: true })}
                        className="w-full bg-transparent text-sm font-medium tabular-nums focus:outline-none"
                        style={{ color: BANK.ink }}
                      />
                    </PremiumField>
                  </FormSection>

                  {/* Section 2 — Account */}
                  <FormSection title="بيانات الحساب">
                    <PremiumField
                      label="كلمة المرور"
                      icon={<Lock className="h-4 w-4" />}
                      trailing={
                        <PwToggle
                          shown={showPw}
                          onToggle={() => setShowPw((v) => !v)}
                        />
                      }
                      error={
                        errors.password
                          ? "كلمة المرور مطلوبة (6 أحرف على الأقل)."
                          : undefined
                      }
                    >
                      <input
                        type={showPw ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        {...register("password", {
                          required: true,
                          minLength: 6,
                        })}
                        className="w-full bg-transparent text-sm font-medium focus:outline-none"
                        style={{ color: BANK.ink }}
                      />
                    </PremiumField>
                    <PremiumField
                      label="تأكيد كلمة المرور"
                      icon={<Lock className="h-4 w-4" />}
                      trailing={
                        <PwToggle
                          shown={showConfirmPw}
                          onToggle={() => setShowConfirmPw((v) => !v)}
                        />
                      }
                      error={
                        errors.confirmPassword
                          ? "تأكيد كلمة المرور مطلوب."
                          : undefined
                      }
                    >
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        {...register("confirmPassword", { required: true })}
                        className="w-full bg-transparent text-sm font-medium focus:outline-none"
                        style={{ color: BANK.ink }}
                      />
                    </PremiumField>
                  </FormSection>

                  {/* Section 3 — Financials */}
                  <FormSection title="المعلومات المالية الأولية">
                    <PremiumField
                      label="الراتب الشهري"
                      icon={<Wallet className="h-4 w-4" />}
                      trailing={
                        <span
                          className="text-xs font-semibold"
                          style={{ color: BANK.muted }}
                        >
                          ر.س
                        </span>
                      }
                      error={
                        errors.monthlySalary ? "الراتب الشهري مطلوب." : undefined
                      }
                    >
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="18000"
                        {...register("monthlySalary", { required: true })}
                        className="w-full bg-transparent text-sm font-medium tabular-nums focus:outline-none"
                        style={{ color: BANK.ink }}
                      />
                    </PremiumField>
                    <PremiumField
                      label="المدخرات الحالية (اختياري)"
                      icon={<PiggyBank className="h-4 w-4" />}
                      trailing={
                        <span
                          className="text-xs font-semibold"
                          style={{ color: BANK.muted }}
                        >
                          ر.س
                        </span>
                      }
                    >
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="0"
                        {...register("optionalSavings")}
                        className="w-full bg-transparent text-sm font-medium tabular-nums focus:outline-none"
                        style={{ color: BANK.ink }}
                      />
                    </PremiumField>
                  </FormSection>

                  {/* Server / mismatch error */}
                  {error && (
                    <div
                      className="rounded-xl p-3 text-xs sm:col-span-2"
                      style={{
                        backgroundColor: "#F9E7E2",
                        border: `1px solid ${BANK.accent}`,
                        color: "#8A2F2A",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {/* Primary CTA */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="cta-btn flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ backgroundColor: BANK.inkAlt }}
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-b-transparent" />
                    ) : (
                      <ArrowLeft className="h-4 w-4" />
                    )}
                    إنشاء الحساب
                  </button>

                  {/* Login link */}
                  <p
                    className="text-center text-xs"
                    style={{ color: BANK.muted }}
                  >
                    لديك حساب بالفعل؟{" "}
                    <Link
                      to="/login"
                      className="font-bold transition hover:opacity-80"
                      style={{ color: BANK.accent }}
                    >
                      سجّل الدخول
                    </Link>
                  </p>
                </form>

                {/* Trust note */}
                <div
                  className="mt-8 flex items-start gap-2.5 rounded-2xl p-3.5 text-[11px] leading-relaxed"
                  style={{
                    backgroundColor: BANK.paper,
                    border: `1px solid ${BANK.paperEdge}`,
                    color: BANK.muted,
                  }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: "rgba(0,33,52,0.06)",
                      color: BANK.inkAlt,
                    }}
                    aria-hidden="true"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    بياناتك تُستخدم فقط لتقديم التحليل المالي داخل المنصة.
                  </span>
                </div>
              </div>
            </motion.section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px]">
          <FooterLink label="الخصوصية" />
          <span
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: BANK.paperEdge }}
            aria-hidden="true"
          />
          <FooterLink label="الشروط" />
          <span
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: BANK.paperEdge }}
            aria-hidden="true"
          />
          <FooterLink label="الأمان" />
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Decorative background — matches Login page                          */
/* ------------------------------------------------------------------ */

function DecorativeBackground() {
  return (
    <>
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-[120px]"
        style={{ backgroundColor: "rgba(0,33,52,0.10)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-40 top-[10%] h-[420px] w-[420px] rounded-full blur-[120px]"
        style={{ backgroundColor: "rgba(213,141,121,0.16)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-160px] left-[30%] h-[360px] w-[360px] rounded-full blur-[120px]"
        style={{ backgroundColor: "rgba(131,127,216,0.10)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-[35%] top-[45%] h-[220px] w-[220px] rounded-full blur-[90px]"
        style={{ backgroundColor: "rgba(2,21,30,0.06)" }}
        aria-hidden="true"
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Brand experience (left column)                                       */
/* ------------------------------------------------------------------ */

function BrandExperience() {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="hidden lg:block"
    >
      <Logo size="lg" />

      <h1
        className="mt-10 text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl"
        style={{ color: BANK.ink }}
      >
        ابدأ رحلتك المالية{" "}
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(135deg, ${BANK.accent} 0%, #B96D57 100%)`,
            WebkitBackgroundClip: "text",
          }}
        >
          بوعي
        </span>
      </h1>

      <p
        className="mt-5 max-w-md text-sm leading-relaxed sm:text-base"
        style={{ color: BANK.muted }}
      >
        أنشئ حسابك وابدأ بتحليل وضعك المالي، بناء خطة ادخار مخصّصة،
        واتخاذ قرارات مالية أكثر وعياً.
      </p>

      <ul className="mt-8 grid max-w-md gap-3">
        <FeatureCard
          icon={<BarChart2 className="h-4 w-4" />}
          iconColor={BANK.inkAlt}
          title="تحليل مالي ذكي"
          description="نفهم دخلك ومصروفاتك والتزاماتك بشكل واضح."
        />
        <FeatureCard
          icon={<Target className="h-4 w-4" />}
          iconColor={BANK.accent}
          title="خطة ادخار مخصّصة"
          description="نبني لك خطة واقعية تناسب أهدافك وقدرتك المالية."
        />
        <FeatureCard
          icon={<ShieldCheck className="h-4 w-4" />}
          iconColor={BANK.inkAlt}
          title="قرارات تمويل أكثر وعياً"
          description="نساعدك على تقييم جاهزيتك قبل أي التزام مالي."
        />
      </ul>
    </motion.aside>
  );
}

function FeatureCard({
  icon,
  iconColor,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <li
      className="feature-card flex items-start gap-3 rounded-2xl p-4"
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${BANK.paperEdge}`,
        boxShadow: "0 1px 2px rgba(2,21,30,0.02), 0 8px 20px rgba(2,21,30,0.05)",
      }}
    >
      <span
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${iconColor}12`,
          color: iconColor,
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold" style={{ color: BANK.ink }}>
          {title}
        </p>
        <p
          className="mt-0.5 text-[11px] leading-relaxed"
          style={{ color: BANK.muted }}
        >
          {description}
        </p>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Form section — small title + 2-col grid                              */
/* ------------------------------------------------------------------ */

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: BANK.accent }}
        >
          {title}
        </span>
        <span
          className="h-px flex-1"
          style={{ backgroundColor: BANK.paperEdge }}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Premium field — matches Login page, plus optional inline error       */
/* ------------------------------------------------------------------ */

interface PremiumFieldProps {
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}

function PremiumField({
  label,
  icon,
  trailing,
  children,
  error,
}: PremiumFieldProps) {
  return (
    <label className="block">
      <span
        className="mb-2 block text-xs font-semibold"
        style={{ color: BANK.muted }}
      >
        {label}
      </span>
      <div
        className="reg-input flex items-center gap-2 rounded-2xl px-4 transition"
        style={{
          height: 52,
          backgroundColor: BANK.paper,
          border: `1px solid ${error ? BANK.accent : BANK.paperEdge}`,
        }}
      >
        <span style={{ color: BANK.inkAlt }} className="flex-shrink-0">
          {icon}
        </span>
        {children}
        {trailing && <span className="flex-shrink-0">{trailing}</span>}
      </div>
      {error && (
        <p
          className="mt-1.5 text-[11px] font-medium"
          style={{ color: "#8A2F2A" }}
        >
          {error}
        </p>
      )}
    </label>
  );
}

function PwToggle({
  shown,
  onToggle,
}: {
  shown: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-md p-1 transition hover:bg-black/5"
      style={{ color: BANK.muted }}
      aria-label={shown ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      tabIndex={-1}
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Footer link                                                          */
/* ------------------------------------------------------------------ */

function FooterLink({ label }: { label: string }) {
  return (
    <a
      href="#"
      className="font-semibold transition hover:opacity-80"
      style={{ color: BANK.muted }}
    >
      {label}
    </a>
  );
}


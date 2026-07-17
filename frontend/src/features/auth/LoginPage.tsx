import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowLeft,
  BarChart2,
  Target,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Logo } from "../../components/shared/Logo";
import { useAuth } from "./authStore";

/* ------------------------------------------------------------------ */
/* Bank palette (Login page only)                                      */
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

const DEMO_EMAIL = "ahmed@trayyath.demo";
const DEMO_PASSWORD = "123456";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app/financial-analysis");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تسجيل الدخول.");
    } finally {
      setLoading(false);
    }
  };

  const submitDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      navigate("/app/financial-analysis");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الدخول التجريبي.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: BANK.paper }}
    >
      {/* Editorial decorative shapes — light, minimal, no solid blocks */}
      <DecorativeBackground />

      {/* Scoped coral focus + subtle card float */}
      <style>{`
        .login-input:focus-within {
          border-color: ${BANK.accent} !important;
          box-shadow: 0 0 0 4px rgba(213,141,121,0.15);
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
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
        {/* Top strip — small home link */}
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
            تسجيل الدخول
          </span>
        </div>

        {/* Main two-column grid */}
        <div className="flex flex-1 items-center py-10">
          <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* -------- LEFT: Brand experience (desktop) -------- */}
            <BrandExperience />

            {/* -------- RIGHT: Login card -------- */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              className="mx-auto w-full max-w-[500px]"
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
                {/* Card branding */}
                <div className="flex flex-col items-center text-center">
                  <Logo size="md" />
                  <h2
                    className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl"
                    style={{ color: BANK.ink }}
                  >
                    أهلاً بعودتك
                  </h2>
                  <p
                    className="mt-2 max-w-sm text-sm leading-relaxed"
                    style={{ color: BANK.muted }}
                  >
                    سجّل دخولك للوصول إلى تحليلك المالي وخططك الذكية.
                  </p>
                </div>

                <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
                  <PremiumField
                    label="البريد الإلكتروني"
                    icon={<Mail className="h-4 w-4" />}
                  >
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-transparent text-sm font-medium focus:outline-none"
                      style={{ color: BANK.ink }}
                    />
                  </PremiumField>

                  <PremiumField
                    label="كلمة المرور"
                    icon={<Lock className="h-4 w-4" />}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="rounded-md p-1 transition hover:bg-black/5"
                        style={{ color: BANK.muted }}
                        aria-label={
                          showPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                        }
                        tabIndex={-1}
                      >
                        {showPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  >
                    <input
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-transparent text-sm font-medium focus:outline-none"
                      style={{ color: BANK.ink }}
                    />
                  </PremiumField>

                  {/* Remember + forgot on one row */}
                  <div className="flex items-center justify-between text-xs">
                    <label
                      className="flex cursor-pointer select-none items-center gap-2"
                      style={{ color: BANK.muted }}
                    >
                      <span className="relative flex h-4 w-4 items-center justify-center">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="peer h-4 w-4 cursor-pointer appearance-none rounded transition"
                          style={{
                            border: `1.5px solid ${remember ? BANK.accent : BANK.paperEdge}`,
                            backgroundColor: remember ? BANK.accent : "#FFFFFF",
                          }}
                        />
                        {remember && (
                          <svg
                            className="pointer-events-none absolute h-3 w-3"
                            viewBox="0 0 12 12"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M2 6.5L4.8 9.2L10 3.8"
                              stroke="#FFFFFF"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      تذكّرني
                    </label>
                    <button
                      type="button"
                      className="font-semibold transition hover:opacity-80"
                      style={{ color: BANK.accent }}
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  {error && (
                    <div
                      className="rounded-xl p-3 text-xs"
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
                    تسجيل الدخول
                  </button>
                </form>

                {/* Register */}
                <p
                  className="mt-6 text-center text-xs"
                  style={{ color: BANK.muted }}
                >
                  ليس لديك حساب؟{" "}
                  <Link
                    to="/register"
                    className="font-bold transition hover:opacity-80"
                    style={{ color: BANK.accent }}
                  >
                    أنشئ حساباً جديداً
                  </Link>
                </p>
              </div>

              {/* Demo access — premium secondary card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
                className="mx-auto mt-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5"
                style={{
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${BANK.paperEdge}`,
                  boxShadow: "0 1px 2px rgba(2,21,30,0.03), 0 10px 24px rgba(2,21,30,0.05)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${BANK.ai}18`,
                      color: BANK.ai,
                    }}
                    aria-hidden="true"
                  >
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: BANK.ink }}
                    >
                      تجربة سريعة
                    </p>
                    <p
                      className="mt-0.5 text-[11px] leading-relaxed"
                      style={{ color: BANK.muted }}
                    >
                      استخدم الحساب التجريبي لاستكشاف المنصة.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={submitDemo}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    border: `1px solid ${BANK.accent}`,
                    color: BANK.accent,
                    backgroundColor: "transparent",
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  استخدام الحساب التجريبي
                </button>
              </motion.div>
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
/* Decorative background — subtle blurred blobs, no solid rectangles   */
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
      {/* Logo — larger, top of the column */}
      <Logo size="lg" />

      {/* Hero title */}
      <h1
        className="mt-10 text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl"
        style={{ color: BANK.ink }}
      >
        قراراتك المالية
        <br />
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(135deg, ${BANK.accent} 0%, #B96D57 100%)`,
            WebkitBackgroundClip: "text",
          }}
        >
          تبدأ من وعي
        </span>
      </h1>

      {/* Description */}
      <p
        className="mt-5 max-w-md text-sm leading-relaxed sm:text-base"
        style={{ color: BANK.muted }}
      >
        منصة تريّث تعطيك رؤية واضحة لدخلك والتزاماتك وأهدافك، وتقدّم توصيات
        ذكية تساعدك على اتخاذ قرارات مالية أفضل بلغة عربية أصلية.
      </p>

      {/* Feature cards */}
      <ul className="mt-8 grid gap-3 max-w-md">
        <FeatureCard
          icon={<BarChart2 className="h-4 w-4" />}
          iconColor={BANK.inkAlt}
          title="تحليل مالي ذكي"
          description="أربعة مؤشرات كافية لفهم وضعك المالي الحالي."
        />
        <FeatureCard
          icon={<Target className="h-4 w-4" />}
          iconColor={BANK.accent}
          title="خطة ادخار مخصّصة"
          description="توصية شهرية للتوزيع المتوازن على أهدافك."
        />
        <FeatureCard
          icon={<ShieldCheck className="h-4 w-4" />}
          iconColor={BANK.inkAlt}
          title="قرارات تمويل أكثر وعياً"
          description="تقييم استعدادك للتمويل قبل التقدّم لأي جهة."
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
        <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: BANK.muted }}>
          {description}
        </p>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Premium field — label above, navy icon, subtle coral focus          */
/* ------------------------------------------------------------------ */

interface PremiumFieldProps {
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

function PremiumField({ label, icon, trailing, children }: PremiumFieldProps) {
  return (
    <label className="block">
      <span
        className="mb-2 block text-xs font-semibold"
        style={{ color: BANK.muted }}
      >
        {label}
      </span>
      <div
        className="login-input flex items-center gap-2 rounded-2xl px-4 transition"
        style={{
          height: 52,
          backgroundColor: BANK.paper,
          border: `1px solid ${BANK.paperEdge}`,
        }}
      >
        <span style={{ color: BANK.inkAlt }} className="flex-shrink-0">
          {icon}
        </span>
        {children}
        {trailing && <span className="flex-shrink-0">{trailing}</span>}
      </div>
    </label>
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

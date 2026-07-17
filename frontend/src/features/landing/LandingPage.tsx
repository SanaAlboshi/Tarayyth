import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Layers,
  BrainCircuit,
  LineChart,
  Wallet,
  Building2,
  Star,
  ChevronDown,
  Play,
  BadgeCheck,
  Zap,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "../../components/shared/Logo";
import { cn } from "../../lib/format";

const features = [
  {
    icon: <BrainCircuit className="h-5 w-5" />,
    title: "تحليل مالي ذكي",
    desc: "محرك Gemini يحلل دخلك ومصاريفك ويقدم توصيات فورية.",
  },
  {
    icon: <LineChart className="h-5 w-5" />,
    title: "تتبع الأهداف المالية",
    desc: "خطط لهدفك، وراقب تقدمك شهرياً حتى تحقيقه.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "اختبار المرونة المالية",
    desc: "محاكاة سيناريوهات ضغط لمعرفة قدرتك على مواجهة الأزمات.",
  },
  {
    icon: <BadgeCheck className="h-5 w-5" />,
    title: "فحص أهلية التمويل",
    desc: "تقييم تعليمي يساعدك على معرفة استعدادك قبل التقدّم لطلب تمويل.",
  },
  {
    icon: <Layers className="h-5 w-5" />,
    title: "مدرّب مالي شخصي بالـAI",
    desc: "نصائح وتنبيهات مستمرة لتحسين عاداتك المالية.",
  },
  {
    icon: <Wallet className="h-5 w-5" />,
    title: "خطة شهرية مخصصة",
    desc: "توزيع ذكي لدخلك بين الاحتياجات والادخار والأهداف.",
  },
];

const steps = [
  {
    n: "01",
    title: "أنشئ حسابك",
    desc: "سجّل بحساب شخصي في أقل من دقيقة، بيانات آمنة تماماً.",
  },
  {
    n: "02",
    title: "أدخل بياناتك المالية",
    desc: "نموذج مختصر يجمع الدخل والمصاريف والالتزامات وهدفك المالي.",
  },
  {
    n: "03",
    title: "احصل على تقرير AI",
    desc: "توصيات ذكية وخطة شهرية مبنية على وضعك الحالي.",
  },
  {
    n: "04",
    title: "حقّق أهدافك",
    desc: "تابع تقدمك مع مدرّب AI شخصي يبقيك على المسار الصحيح.",
  },
];

const reasons = [
  { icon: <Zap className="h-4 w-4" />, title: "استجابة فورية", desc: "تحليل خلال ثوانٍ" },
  { icon: <ShieldCheck className="h-4 w-4" />, title: "بيانات آمنة", desc: "تشفير كامل ومحلي" },
  { icon: <Globe className="h-4 w-4" />, title: "بالعربية بالكامل", desc: "تجربة RTL أصيلة" },
  { icon: <BrainCircuit className="h-4 w-4" />, title: "AI شفاف", desc: "توصيات بمبررات واضحة" },
];

const testimonials = [
  {
    name: "عبير الحربي",
    role: "موظفة قطاع خاص",
    quote:
      "لأول مرة أشعر بأنني أفهم وضعي المالي بوضوح، والتوصيات كانت عملية وقابلة للتنفيذ فوراً.",
    initials: "عح",
  },
  {
    name: "خالد الشمري",
    role: "مهندس برمجيات",
    quote:
      "المدرّب المالي ينبّهني كل شهر وأصبح ادخاري أكثر انتظاماً. أشعر بأني أقترب من هدفي كل أسبوع.",
    initials: "خش",
  },
  {
    name: "منى العتيبي",
    role: "طالبة دراسات عليا",
    quote:
      "فحص أهلية التمويل ساعدني على معرفة أنني لست جاهزة بعد، وأعطاني خطة واضحة للاستعداد.",
    initials: "مع",
  },
];

const faqs = [
  {
    q: "هل بياناتي المالية آمنة على منصة Trayyath؟",
    a: "نعم، جميع بياناتك تُخزَّن بشكل آمن ولا نشاركها مع أي طرف ثالث. أنت وحدك من يملك الوصول إلى تحليلاتك.",
  },
  {
    q: "كيف يعمل محرك الذكاء الاصطناعي داخل المنصة؟",
    a: "نستخدم محرك Gemini المتقدم من Google مع نماذج مالية داخلية لضمان دقة التوصيات ووضوح مبرراتها.",
  },
  {
    q: "هل تصدر المنصة قرارات موافقة أو رفض للتمويل؟",
    a: "لا. جميع التقييمات تعليمية واستشارية فقط، لا نمثل بنكاً ولا نصدر قرارات ائتمانية. غايتنا مساعدتك على الاستعداد قبل التقدم لأي جهة تمويلية.",
  },
  {
    q: "ما تكلفة استخدام المنصة؟",
    a: "التسجيل والاستخدام الأساسي مجاني تماماً. هدفنا مساعدة الأفراد على تحسين وعيهم المالي.",
  },
];

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-30 border-b border-outline bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Logo />
          <nav className="hidden gap-8 text-sm font-medium text-ink-soft md:flex">
            <a href="#features" className="hover:text-primary">المميزات</a>
            <a href="#how" className="hover:text-primary">كيف تعمل</a>
            <a href="#why" className="hover:text-primary">لماذا Trayyath</a>
            <a href="#faq" className="hover:text-primary">الأسئلة الشائعة</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl border border-outline bg-card px-4 py-2 text-sm font-semibold text-ink hover:border-primary/40 hover:text-primary"
            >
              تسجيل الدخول
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-primary-dark"
            >
              إنشاء حساب
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.08), transparent 50%)",
        }} />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-12 lg:py-32">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent-light" />
              منصة الذكاء المالي الأولى في المنطقة
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
            >
              اتخذ قراراتك المالية
              <br />
              <span className="bg-gradient-to-l from-accent-light via-accent to-white bg-clip-text text-transparent">
                بذكاء وثقة تامة
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg"
            >
              Trayyath هو مدرّبك المالي الشخصي بالذكاء الاصطناعي: يساعدك على فهم وضعك،
              تحقيق أهدافك، ومعرفة استعدادك المالي قبل التقدم لأي طلب تمويل.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-elevated transition hover:bg-accent-dark"
              >
                ابدأ مجاناً
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Play className="h-4 w-4" />
                جولة سريعة
              </a>
            </motion.div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-accent-light" />
                يعتمده آلاف الأفراد لتحقيق أهدافهم
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent-light" />
                أمان مصرفي متقدم
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/40 to-accent/30 blur-3xl" />
              <div className="relative rounded-3xl border border-white/10 bg-white/95 p-6 shadow-elevated">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold">تقرير AI مباشر</span>
                  </div>
                  <span className="rounded-full bg-ok-light px-2.5 py-0.5 text-[10px] font-bold text-ok-dark">حي</span>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-outline bg-surface-alt/50 p-4">
                    <p className="text-[11px] font-semibold text-ink-mute">درجة الجاهزية المالية</p>
                    <div className="mt-2 flex items-end gap-3">
                      <span className="text-3xl font-bold text-primary">82</span>
                      <span className="pb-1 text-xs text-ok-dark">+6 هذا الأسبوع</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-outline">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "82%" }}
                        transition={{ duration: 1.2 }}
                        className="h-full rounded-full bg-gradient-to-l from-primary to-accent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: "نسبة الادخار", v: "24%", tone: "text-ok-dark" },
                      { l: "الالتزامات", v: "18%", tone: "text-primary-dark" },
                      { l: "الطوارئ", v: "6 أشهر", tone: "text-primary-dark" },
                      { l: "المخاطرة", v: "منخفضة", tone: "text-ok-dark" },
                    ].map((k) => (
                      <div key={k.l} className="rounded-xl bg-surface p-3">
                        <p className="text-[10px] text-ink-mute">{k.l}</p>
                        <p className={cn("mt-1 text-sm font-bold", k.tone)}>{k.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-primary p-4 text-white">
                    <p className="text-[11px] font-semibold text-white/70">توصية الذكاء الاصطناعي</p>
                    <p className="mt-1 text-sm font-semibold">
                      وضعك المالي جاهز لتقديم طلب تمويل سكني بشروط مميزة.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">المميزات</span>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
            كل ما تحتاجه لاتخاذ قرارات مالية أذكى
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-ink-soft">
            مجموعة متكاملة من الأدوات المصممة لتحويل بياناتك المالية إلى قرارات دقيقة وتوصيات قابلة للتنفيذ.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-outline bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-light/60 blur-2xl transition group-hover:scale-125" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-card">
                {f.icon}
              </div>
              <h3 className="relative mt-4 text-base font-bold">{f.title}</h3>
              <p className="relative mt-1.5 text-sm text-ink-soft">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-surface-alt/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">كيف تعمل</span>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">أربع خطوات نحو قرار مالي واضح</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-outline bg-card p-6 shadow-card"
              >
                <span className="absolute -top-4 right-6 rounded-xl bg-gradient-to-tr from-primary to-primary-dark px-3 py-1 text-sm font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-ink-soft">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section id="why" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">لماذا Trayyath</span>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
              مدرّب مالي ذكي في جيبك
            </h2>
            <p className="mt-3 text-sm text-ink-soft">
              Trayyath مصمم لمساعدتك على فهم وضعك المالي، تحقيق أهدافك، وتحسين عاداتك،
              ومعرفة متى تكون جاهزاً للتقدم بطلب تمويل.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {reasons.map((r) => (
                <div key={r.title} className="flex items-start gap-3 rounded-2xl border border-outline bg-card p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                    {r.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{r.title}</p>
                    <p className="text-xs text-ink-mute">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/25 to-accent/20 blur-3xl" />
            <div className="relative grid gap-4 rounded-3xl border border-outline bg-card p-8 shadow-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-mute">هدفك المالي</p>
                  <p className="text-lg font-bold">شراء منزل خلال 36 شهر</p>
                </div>
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: "التقدم", v: "62%" },
                  { l: "المتبقي", v: "14 شهر" },
                  { l: "الحالة", v: "على المسار" },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl bg-surface-alt/60 p-3 text-center">
                    <p className="text-[10px] text-ink-mute">{s.l}</p>
                    <p className="mt-1 text-base font-bold text-ink">{s.v}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-gradient-to-l from-primary via-primary-dark to-[#082E2A] p-4 text-white">
                <p className="text-[11px] text-white/60">نصيحة المدرّب الذكي</p>
                <p className="mt-1 text-sm font-semibold">
                  تقليل مصاريف المطاعم 15% سيقربك من هدفك بحوالي شهر إضافي.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-surface-alt/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">آراء عملائنا</span>
            <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">ثقة يعبّر عنها أعضاء المجتمع المالي</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-outline bg-card p-6 shadow-card"
              >
                <div className="flex items-center gap-1 text-accent">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-[11px] text-ink-mute">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-24">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">الأسئلة الشائعة</span>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">إجابات على أكثر الأسئلة تكراراً</h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className="overflow-hidden rounded-2xl border border-outline bg-card">
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-right"
                >
                  <span className="text-sm font-bold">{f.q}</span>
                  <ChevronDown
                    className={cn("h-4 w-4 text-primary transition-transform", open && "rotate-180")}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="border-t border-outline p-5 text-sm text-ink-soft">{f.a}</p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-hero-gradient p-10 text-center shadow-elevated">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
          <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
            جاهز لبدء رحلتك المالية الذكية؟
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/70">
            انضم إلى Trayyath واحصل على تحليل مالي متقدم بضغطة زر واحدة.
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent-dark"
            >
              ابدأ الآن
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              لدي حساب
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-outline bg-card py-10 text-center text-xs text-ink-mute">
        <div className="mx-auto max-w-6xl px-6">
          <Logo />
          <p className="mt-4">© {new Date().getFullYear()} Trayyath — منصة الذكاء المالي.</p>
          <div className="mt-2 flex justify-center gap-4">
            <span>سياسة الخصوصية</span>
            <span>الشروط والأحكام</span>
            <span>تواصل معنا</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

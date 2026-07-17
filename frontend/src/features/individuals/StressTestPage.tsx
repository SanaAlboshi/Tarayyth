import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  TrendingDown,
  AlertTriangle,
  CreditCard,
  Heart,
  Baby,
  Flame,
  Briefcase,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  BarChart2,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "../../components/shared/PageHeader";
import { Card, CardHeader } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { Badge } from "../../components/shared/Badge";
import { ScoreRing } from "../../components/shared/ScoreRing";
import { EmptyState } from "../../components/shared/EmptyState";
import { LoadingOverlay } from "../../components/shared/LoadingOverlay";
import { useAnalysis } from "../analysis/analysisStore";
import { api } from "../../lib/api";
import { ScoreKey, SCENARIO_CATALOG } from "./scenariosCatalog";
import { ScenarioOutcome } from "../../types";
import { cn, formatPercent, riskTone } from "../../lib/format";

export type { ScoreKey };

const iconMap: Record<string, React.ReactNode> = {
  salary_drop_20: <TrendingDown className="h-5 w-5" />,
  unexpected_expense: <AlertTriangle className="h-5 w-5" />,
  new_loan: <CreditCard className="h-5 w-5" />,
  marriage: <Heart className="h-5 w-5" />,
  baby: <Baby className="h-5 w-5" />,
  inflation: <Flame className="h-5 w-5" />,
  job_loss: <Briefcase className="h-5 w-5" />,
};

export function StressTestPage() {
  const { input, result } = useAnalysis();
  const [outcome, setOutcome] = useState<ScenarioOutcome | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (scenario: string) => {
    if (!input || !result) return;
    setSelected(scenario);
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<ScenarioOutcome>("/scenarios", {
        input,
        baseline: result,
        scenario,
      });
      setOutcome(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تنفيذ السيناريو.");
    } finally {
      setLoading(false);
    }
  };

  if (!result || !input) {
    return (
      <div>
        <PageHeader
          eyebrow="اختبار المرونة المالية"
          title="اختبر قدرتك على مواجهة الأزمات"
          description="قم بإجراء تحليل مالي أولاً لتتمكن من تشغيل سيناريوهات الضغط."
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <Card>
          <EmptyState
            icon={<BarChart2 className="h-6 w-6" />}
            title="بيانات التحليل غير متوفرة"
            description="اذهب إلى نموذج التحليل المالي لإدخال بياناتك أولاً."
            action={
              <Link to="/app/analysis">
                <Button icon={<ArrowLeft className="h-4 w-4" />}>ابدأ التحليل</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="اختبار المرونة المالية"
        title="🛡️ اختبار المرونة"
        description="حاكِ سيناريوهات ضغط مختلفة وشاهد كيف تتغير جاهزيتك المالية ومستوى الخطر."
        icon={<ShieldCheck className="h-5 w-5" />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader title="اختر سيناريو" subtitle="7 اختبارات مالية" icon={<Sparkles className="h-4 w-4" />} />
            <div className="space-y-2">
              {SCENARIO_CATALOG.map((s) => (
                <button
                  key={s.key}
                  onClick={() => run(s.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition",
                    selected === s.key
                      ? "border-primary bg-primary-light shadow-card"
                      : "border-outline bg-card hover:border-primary/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      selected === s.key ? "bg-primary text-white" : "bg-surface-alt text-primary"
                    )}
                  >
                    {iconMap[s.key]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink">{s.title}</p>
                    <p className="text-[11px] text-ink-mute">{s.description}</p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-ink-mute" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {!outcome && !loading && (
            <Card>
              <EmptyState
                icon={<ShieldCheck className="h-6 w-6" />}
                title="اختر سيناريو لبدء المحاكاة"
                description="سيتم إعادة حساب جميع المؤشرات وعرض التأثير على جاهزيتك المالية."
              />
            </Card>
          )}

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger-light p-3 text-xs text-danger-dark">
              {error}
            </div>
          )}

          {outcome && (
            <motion.div
              key={outcome.scenario}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                      نتيجة السيناريو
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-ink">{outcome.title}</h3>
                    <p className="mt-1 max-w-lg text-sm text-ink-soft">{outcome.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">قبل: {outcome.oldRisk}</Badge>
                      <ArrowRight className="h-3 w-3 text-ink-mute" />
                      <Badge tone={outcome.newRisk === "منخفض" ? "ok" : outcome.newRisk === "متوسط" ? "primary" : outcome.newRisk === "مرتفع" ? "warn" : "danger"}>
                        بعد: {outcome.newRisk}
                      </Badge>
                      <Badge tone="gold" icon={<Sparkles className="h-3 w-3" />}>
                        احتمالية {formatPercent(outcome.probability)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-center text-[11px] text-ink-mute">قبل</p>
                      <ScoreRing value={outcome.oldScore} size={104} label="" hint="" />
                    </div>
                    <div>
                      <p className="text-center text-[11px] text-ink-mute">بعد</p>
                      <ScoreRing value={outcome.newScore} size={104} label="" hint="" tone={outcome.newScore >= outcome.oldScore ? "ok" : outcome.newScore >= 40 ? "warn" : "danger"} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="تأثير السيناريو على مدى 6 أشهر" icon={<BarChart2 className="h-4 w-4" />} />
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={outcome.impactTimeline.map((p) => ({ ...p, mLabel: `شهر ${p.month}` }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D9" vertical={false} />
                      <XAxis dataKey="mLabel" tick={{ fontSize: 11 }} stroke="#5C7278" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#5C7278" />
                      <Tooltip formatter={(v: number) => [`${v}%`, "الجاهزية"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      <Line type="monotone" dataKey="score" stroke="#0E6E5C" strokeWidth={2.5} dot={{ r: 3, fill: "#0E6E5C" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader title="نصيحة عملية" icon={<Sparkles className="h-4 w-4" />} />
                  <p className="text-sm leading-relaxed text-ink-soft">{outcome.advice}</p>
                </Card>
                <Card>
                  <CardHeader title="تفسير الذكاء الاصطناعي" icon={<AlertTriangle className="h-4 w-4" />} />
                  <p className="text-sm leading-relaxed text-ink-soft">{outcome.aiExplanation}</p>
                </Card>
              </div>

              <div className={cn("rounded-2xl p-5", riskTone(outcome.newRisk))}>
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
                  التقييم النهائي بعد السيناريو
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {outcome.newScore >= 70
                    ? "قدرة عالية على تحمّل الضغط"
                    : outcome.newScore >= 45
                    ? "قدرة معتدلة تحتاج تحسين"
                    : "وضع هش يتطلب تدخل عاجل"}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {loading && <LoadingOverlay label="جارٍ محاكاة السيناريو..." />}
    </div>
  );
}

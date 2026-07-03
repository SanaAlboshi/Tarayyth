import React, { useState } from "react";
import { analyzeFinancialStatus } from "./api";
import {
  AnalyzeFormData,
  AnalyzeResponseBody,
  Decision,
  RiskLevel,
} from "./types";

const initialFormData: AnalyzeFormData = {
  monthlySalary: "",
  monthlyExpenses: "",
  monthlyDebts: "",
  restaurantSpending: "",
  entertainmentSpending: "",
  financialGoal: "",
  goalPrice: "",
  desiredMonths: "",
};

interface FieldConfig {
  name: keyof AnalyzeFormData;
  label: string;
  placeholder: string;
  type: "number" | "text";
  suffix?: string;
}

const numericFields: FieldConfig[] = [
  {
    name: "monthlySalary",
    label: "الراتب الشهري",
    placeholder: "مثال: 10000",
    type: "number",
    suffix: "ر.س",
  },
  {
    name: "monthlyExpenses",
    label: "المصاريف الشهرية",
    placeholder: "مثال: 5000",
    type: "number",
    suffix: "ر.س",
  },
  {
    name: "monthlyDebts",
    label: "الديون الشهرية",
    placeholder: "مثال: 1000",
    type: "number",
    suffix: "ر.س",
  },
  {
    name: "restaurantSpending",
    label: "إنفاق المطاعم",
    placeholder: "مثال: 800",
    type: "number",
    suffix: "ر.س",
  },
  {
    name: "entertainmentSpending",
    label: "إنفاق الترفيه",
    placeholder: "مثال: 500",
    type: "number",
    suffix: "ر.س",
  },
];

const goalFields: FieldConfig[] = [
  {
    name: "financialGoal",
    label: "الهدف المالي",
    placeholder: "مثال: شراء سيارة",
    type: "text",
  },
  {
    name: "goalPrice",
    label: "سعر الهدف",
    placeholder: "مثال: 60000",
    type: "number",
    suffix: "ر.س",
  },
  {
    name: "desiredMonths",
    label: "المدة المطلوبة",
    placeholder: "مثال: 24",
    type: "number",
    suffix: "شهر",
  },
];

function scoreColor(score: number): string {
  if (score >= 70) return "text-ok";
  if (score >= 40) return "text-warn";
  return "text-danger";
}

function scoreRingColor(score: number): string {
  if (score >= 70) return "#12805F";
  if (score >= 40) return "#C9862F";
  return "#B3413A";
}

function decisionBadgeClasses(decision: Decision): string {
  switch (decision) {
    case "Proceed":
      return "bg-primary-light text-primary-dark border-primary/30";
    case "Delay":
      return "bg-amber-50 text-warn border-warn/30";
    case "Reconsider":
      return "bg-red-50 text-danger border-danger/30";
  }
}

function decisionLabel(decision: Decision): string {
  switch (decision) {
    case "Proceed":
      return "يمكن المتابعة";
    case "Delay":
      return "يُفضّل التأجيل";
    case "Reconsider":
      return "إعادة النظر";
  }
}

function riskBadgeClasses(risk: RiskLevel): string {
  switch (risk) {
    case "Low":
      return "bg-primary-light text-primary-dark border-primary/30";
    case "Medium":
      return "bg-amber-50 text-warn border-warn/30";
    case "High":
      return "bg-red-50 text-danger border-danger/30";
  }
}

function riskLabel(risk: RiskLevel): string {
  switch (risk) {
    case "Low":
      return "منخفضة";
    case "Medium":
      return "متوسطة";
    case "High":
      return "مرتفعة";
  }
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#E7E4DC"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={scoreRingColor(score)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${scoreColor(score)}`}>
          {score}
        </span>
        <span className="text-xs text-ink/50">من 100</span>
      </div>
    </div>
  );
}

export default function App() {
  const [formData, setFormData] = useState<AnalyzeFormData>(initialFormData);
  const [result, setResult] = useState<AnalyzeResponseBody | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ): void {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function isFormValid(): boolean {
    return Object.values(formData).every((v) => v.trim().length > 0);
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!isFormValid()) {
      setError("الرجاء تعبئة جميع الحقول قبل التحليل.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzeFinancialStatus(formData);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء التحليل."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* Header */}
      <header className="border-b border-ink/10 bg-card">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">
              ٪
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">
                Financial AI Analyzer
              </h1>
              <p className="text-sm text-ink/50">
                محلل مالي ذكي يقيّم وضعك المالي ويقترح عليك خطوات عملية
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-8"
        >
          <h2 className="mb-1 text-lg font-semibold text-ink">
            بياناتك المالية
          </h2>
          <p className="mb-6 text-sm text-ink/50">
            أدخل أرقامك الشهرية بدقة للحصول على تحليل أقرب لواقعك
          </p>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {numericFields.map((field) => (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label
                  htmlFor={field.name}
                  className="text-sm font-medium text-ink/80"
                >
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    inputMode="numeric"
                    min={0}
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-ink/15 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {field.suffix && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink/40">
                      {field.suffix}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 border-t border-ink/10 pt-6">
            <h3 className="mb-4 text-sm font-semibold text-ink/70">
              الهدف المالي
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {goalFields.map((field) => (
                <div key={field.name} className="flex flex-col gap-1.5">
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium text-ink/80"
                  >
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      inputMode={field.type === "number" ? "numeric" : "text"}
                      min={field.type === "number" ? 0 : undefined}
                      placeholder={field.placeholder}
                      value={formData[field.name]}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-ink/15 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    {field.suffix && (
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink/40">
                        {field.suffix}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {loading ? "جاري التحليل..." : "Analyze Financial Status"}
          </button>
        </form>

        {/* Results */}
        {result && (
          <section className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Readiness Score */}
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:col-span-2 lg:col-span-1">
                <span className="text-sm font-medium text-ink/50">
                  درجة الجاهزية المالية
                </span>
                <ScoreGauge score={result.metrics.financialReadinessScore} />
              </div>

              {/* Monthly Saving */}
              <div className="flex flex-col justify-center gap-2 rounded-2xl border border-ink/10 bg-card p-6 shadow-sm">
                <span className="text-sm font-medium text-ink/50">
                  الادخار الشهري
                </span>
                <span
                  className={`text-2xl font-bold ${
                    result.metrics.saving >= 0 ? "text-ok" : "text-danger"
                  }`}
                >
                  {result.metrics.saving.toLocaleString("ar-SA")} ر.س
                </span>
                <span className="text-xs text-ink/40">
                  نسبة الادخار: {result.metrics.savingRate}%
                </span>
              </div>

              {/* Financial Leakage */}
              <div className="flex flex-col justify-center gap-2 rounded-2xl border border-ink/10 bg-card p-6 shadow-sm">
                <span className="text-sm font-medium text-ink/50">
                  التسرب المالي
                </span>
                <span
                  className={`text-2xl font-bold ${
                    result.metrics.financialLeakage > 20
                      ? "text-danger"
                      : "text-ok"
                  }`}
                >
                  {result.metrics.financialLeakage}%
                </span>
                <span className="text-xs text-ink/40">
                  من إنفاق المطاعم والترفيه
                </span>
              </div>

              {/* Decision + Risk */}
              <div className="flex flex-col justify-center gap-3 rounded-2xl border border-ink/10 bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-ink/50">
                    القرار
                  </span>
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${decisionBadgeClasses(
                      result.analysis.decision
                    )}`}
                  >
                    {decisionLabel(result.analysis.decision)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-ink/50">
                    مستوى المخاطرة
                  </span>
                  <span
                    className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClasses(
                      result.analysis.riskLevel
                    )}`}
                  >
                    {riskLabel(result.analysis.riskLevel)}
                  </span>
                </div>
              </div>
            </div>

            {/* Behavior Analysis */}
            <div className="rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-8">
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                  ✦
                </span>
                تحليل السلوك المالي
              </h3>
              <p className="leading-7 text-ink/80">
                {result.analysis.behaviorAnalysis}
              </p>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl border border-ink/10 bg-card p-6 shadow-sm sm:p-8">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                  ✓
                </span>
                التوصيات
              </h3>
              <ul className="space-y-3">
                {result.analysis.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-lg bg-surface px-4 py-3 text-sm text-ink/80"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

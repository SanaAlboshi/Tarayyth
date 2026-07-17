import { generateJson } from "./gemini";
import { AnalysisInput, AnalysisResult } from "./analysis";

export type ReadinessVerdict = "ready" | "almost_ready" | "not_ready";

export interface ReadinessFactor {
  name: string;
  value: string;
  status: "ok" | "warn" | "danger";
  detail: string;
}

export interface ReadinessResult {
  score: number;
  verdict: ReadinessVerdict;
  headline: string;
  explanation: string;
  factors: ReadinessFactor[];
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  monthlyCashFlow: number;
  dti: number;
  disclaimer: string;
}

const DISCLAIMER =
  "هذا التقييم تعليمي واستشاري فقط، تُنتجه أدوات الذكاء الاصطناعي لمساعدتك على الاستعداد قبل التقدّم لطلب تمويل. لا يمثل قراراً بنكياً ولا يعني الموافقة أو الرفض.";

function statusFor(value: number, okMax: number, warnMax: number): ReadinessFactor["status"] {
  if (value <= okMax) return "ok";
  if (value <= warnMax) return "warn";
  return "danger";
}

function statusForHigh(value: number, okMin: number, warnMin: number): ReadinessFactor["status"] {
  if (value >= okMin) return "ok";
  if (value >= warnMin) return "warn";
  return "danger";
}

function verdictOf(score: number): ReadinessVerdict {
  if (score >= 75) return "ready";
  if (score >= 55) return "almost_ready";
  return "not_ready";
}

function heuristic(input: AnalysisInput, analysis: AnalysisResult): ReadinessResult {
  const monthlyCashFlow = Math.max(0, input.salary - input.expenses - input.debts);
  const dti = analysis.debtRatio;

  const factors: ReadinessFactor[] = [
    {
      name: "الدخل الشهري",
      value: `${input.salary.toLocaleString("ar-SA")} ر.س`,
      status: statusForHigh(input.salary, 8000, 4000),
      detail: "الأساس الذي تُبنى عليه كل نسب التقييم.",
    },
    {
      name: "المصاريف الشهرية",
      value: `${analysis.expenseRatio}٪ من الدخل`,
      status: statusFor(analysis.expenseRatio, 55, 75),
      detail: "كلما قلّت النسبة، زاد هامش السداد المتاح لك.",
    },
    {
      name: "نسبة الالتزامات (DTI)",
      value: `${dti}٪`,
      status: statusFor(dti, 30, 45),
      detail: "الحد الآمن أقل من 30٪ من الدخل الشهري.",
    },
    {
      name: "الاستقرار المالي",
      value: `${analysis.financialStability}٪`,
      status: statusForHigh(analysis.financialStability, 70, 50),
      detail: "مؤشر شامل يعكس قدرتك على تحمّل الالتزامات دون ضغط.",
    },
    {
      name: "اتساق الدخل",
      value: `${analysis.incomeConsistency}٪`,
      status: statusForHigh(analysis.incomeConsistency, 75, 55),
      detail: "قدرة الدخل الشهري على الحفاظ على نفس المستوى بلا تذبذب.",
    },
    {
      name: "التدفق النقدي الشهري",
      value: `${monthlyCashFlow.toLocaleString("ar-SA")} ر.س`,
      status: statusForHigh(monthlyCashFlow, 2000, 500),
      detail: "المبلغ المتبقي بعد المصاريف والالتزامات.",
    },
  ];

  // Weighted composite readiness score.
  const score = Math.round(
    Math.max(
      10,
      Math.min(
        98,
        analysis.readinessScore * 0.4 +
          analysis.financialStability * 0.2 +
          analysis.incomeConsistency * 0.15 +
          analysis.repaymentCapacity * 0.15 +
          Math.max(0, 100 - dti) * 0.1
      )
    )
  );

  const verdict = verdictOf(score);

  const strengths: string[] = [];
  const improvements: string[] = [];
  const nextSteps: string[] = [];

  if (dti <= 30) strengths.push("نسبة الالتزامات ضمن الحدود الآمنة (أقل من 30٪).");
  else improvements.push("خفض نسبة الالتزامات إلى أقل من 30٪ من الدخل.");

  if (analysis.expenseRatio <= 60) strengths.push("مصاريفك الشهرية ضمن نطاق صحي.");
  else improvements.push("قلّل نسبة المصاريف الشهرية عن 60٪ من الدخل.");

  if (analysis.incomeConsistency >= 75) strengths.push("دخلك مستقر ومتوقّع.");
  else improvements.push("عزّز مصادر دخل ثابتة لرفع مؤشر اتساق الدخل.");

  if (analysis.financialStability >= 70) strengths.push("مستوى استقرار مالي جيد.");
  else improvements.push("ابنِ استقراراً مالياً أكبر قبل التقدّم لطلب تمويل.");

  if (monthlyCashFlow >= 2000) strengths.push("تدفق نقدي شهري إيجابي وواضح.");
  else improvements.push("ارفع التدفق النقدي الشهري ليكون هامش السداد أكثر أماناً.");

  if (verdict === "ready") {
    nextSteps.push("راجع خيارات التمويل المتاحة وقارن بين شروطها.");
    nextSteps.push("جهّز مستنداتك: كشوف حساب، خطاب تعريف، شهادة راتب.");
    nextSteps.push("حدّد المبلغ والغرض قبل التقدّم لأي جهة تمويلية.");
  } else if (verdict === "almost_ready") {
    nextSteps.push("طبّق التوصيات لمدة 2-3 أشهر قبل التقدّم للتمويل.");
    nextSteps.push("راقب نسبة الالتزامات والمصاريف شهرياً.");
    nextSteps.push("زد الادخار الشهري لدعم القدرة على السداد.");
  } else {
    nextSteps.push("ركّز أولاً على تقليل الديون القائمة.");
    nextSteps.push("عدّل ميزانيتك الشهرية لتخفيض المصاريف غير الأساسية.");
    nextSteps.push("لا تتقدّم بطلب تمويل الآن — سيؤثر ذلك على سجلك الائتماني.");
  }

  const headline =
    verdict === "ready"
      ? "أنت في وضع مالي جيد للتقدّم لطلب تمويل"
      : verdict === "almost_ready"
      ? "أنت قريب من الجاهزية — تحسينات بسيطة تكفي"
      : "لست جاهزاً حالياً للتقدم بطلب تمويل";

  const explanation =
    verdict === "ready"
      ? "مؤشراتك المالية الأساسية تعكس قدرة جيدة على تحمّل التزام تمويلي جديد. راجع خياراتك وقارن قبل أي قرار."
      : verdict === "almost_ready"
      ? "مؤشراتك قريبة من العتبة الآمنة، لكن هناك جانباً أو جانبين بحاجة لتحسين قبل التقدم لأي جهة تمويلية."
      : "بعض المؤشرات الأساسية دون العتبة الآمنة، لذا يُنصح بتحسين وضعك المالي أولاً قبل التفكير بأي تمويل جديد.";

  return {
    score,
    verdict,
    headline,
    explanation,
    factors,
    strengths,
    improvements,
    nextSteps,
    monthlyCashFlow,
    dti,
    disclaimer: DISCLAIMER,
  };
}

export async function assessReadiness(
  input: AnalysisInput,
  analysis: AnalysisResult
): Promise<ReadinessResult> {
  const fallback = heuristic(input, analysis);

  try {
    const prompt = `أنت مدرّب مالي في منصة Trayyath. قدّم تقييماً تعليمياً فقط (ليس قراراً بنكياً)
حول جاهزية العميل للتقدم بطلب تمويل. اعتمد على المؤشرات التالية:
- الدخل الشهري: ${input.salary}
- المصاريف الشهرية: ${input.expenses} (نسبة ${analysis.expenseRatio}٪ من الدخل)
- الديون: ${input.debts} (DTI = ${analysis.debtRatio}٪)
- الاستقرار المالي: ${analysis.financialStability}٪
- اتساق الدخل: ${analysis.incomeConsistency}٪
- القدرة على السداد: ${analysis.repaymentCapacity}٪
- التدفق النقدي الشهري: ${fallback.monthlyCashFlow}

أعِد JSON فقط:
{
  "headline": "عنوان مختصر يعكس الحكم",
  "explanation": "فقرة قصيرة توضح لماذا العميل جاهز أو غير جاهز",
  "strengths": ["نقطة قوة 1","نقطة قوة 2","نقطة قوة 3"],
  "improvements": ["تحسين 1","تحسين 2","تحسين 3"],
  "nextSteps": ["خطوة 1","خطوة 2","خطوة 3"]
}
لا تُصدر أي قرار بالموافقة أو الرفض ولا تدّعِ أنك تمثل بنكاً.`;
    const ai = await generateJson<Partial<ReadinessResult>>(prompt);
    return {
      ...fallback,
      headline: ai.headline?.trim() || fallback.headline,
      explanation: ai.explanation?.trim() || fallback.explanation,
      strengths: Array.isArray(ai.strengths) && ai.strengths.length ? ai.strengths : fallback.strengths,
      improvements:
        Array.isArray(ai.improvements) && ai.improvements.length
          ? ai.improvements
          : fallback.improvements,
      nextSteps:
        Array.isArray(ai.nextSteps) && ai.nextSteps.length ? ai.nextSteps : fallback.nextSteps,
    };
  } catch (err) {
    console.warn("Readiness AI failed, using heuristic", err);
    return fallback;
  }
}

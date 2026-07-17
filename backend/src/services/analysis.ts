import { generateJson } from "./gemini";

export interface AnalysisInput {
  salary: number;
  expenses: number;
  debts: number;
  savings: number;
  restaurants: number;
  entertainment: number;
  goal: string;
  goalPrice: number;
  targetMonths: number;
}

export interface AnalysisResult {
  // Bank-facing eligibility score (does NOT use self-reported savings)
  readinessScore: number;
  // Personal-planning score (uses savings, emergency fund, goal fit)
  personalPlanningScore: number;

  // Verifiable financing indicators (bank-side)
  debtRatio: number;
  expenseRatio: number;
  budgetEfficiency: number;
  financialStability: number;
  repaymentCapacity: number;
  incomeConsistency: number;

  // Personal-planning indicators (individual-side)
  emergencyFund: number;
  goalAchievementProbability: number;
  monthlySavings: number;
  goalMonthsToReach: number;

  disposableIncome: number;
  financialLeakage: number;
  riskLevel: "منخفض" | "متوسط" | "مرتفع" | "حرج";
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  monthlyPlan: string[];
  warnings: string[];
  finalAdvice: string;
}

function heuristicAnalysis(input: AnalysisInput): AnalysisResult {
  const disposable = Math.max(0, input.salary - input.expenses);
  const debtRatio = input.salary > 0 ? Math.min(100, (input.debts / input.salary) * 100) : 0;
  const expenseRatio = input.salary > 0 ? Math.min(100, (input.expenses / input.salary) * 100) : 0;
  const monthlySavings = Math.max(0, disposable);
  const emergencyFundMonths = input.expenses > 0 ? input.savings / input.expenses : 12;
  const leakage = input.restaurants + input.entertainment;
  const leakageRatio = input.salary > 0 ? (leakage / input.salary) * 100 : 0;

  // ------- Verifiable financing indicators (savings excluded) -------
  const stability = Math.max(20, Math.min(98, 90 - debtRatio * 0.4 - Math.max(0, expenseRatio - 55) * 0.4));
  const budgetEfficiency = Math.max(20, Math.min(98, 95 - expenseRatio * 0.5 - leakageRatio * 0.5));

  // Repayment capacity: how much monthly income remains after fixed obligations,
  // expressed as a ratio of disposable-after-debt to salary.
  const debtServicing = Math.min(input.debts, input.salary);
  const repaymentBase = Math.max(0, input.salary - input.expenses - debtServicing);
  const repaymentCapacity =
    input.salary > 0
      ? Math.max(5, Math.min(98, Math.round((repaymentBase / input.salary) * 100)))
      : 5;

  // Income consistency proxy: penalize very high expense/debt ratios that
  // signal reliance on income spikes; salary-only signal until we ingest history.
  const incomeConsistency = Math.max(
    30,
    Math.min(98, Math.round(92 - Math.max(0, expenseRatio - 65) * 0.6 - Math.max(0, debtRatio - 20) * 0.5))
  );

  // Financing eligibility score — savings and emergency fund are NOT inputs.
  let eligibility = 100;
  eligibility -= Math.min(38, debtRatio * 0.7);
  eligibility -= Math.min(24, Math.max(0, expenseRatio - 55) * 0.55);
  eligibility -= Math.min(12, leakageRatio * 0.5);
  eligibility -= Math.max(0, 90 - incomeConsistency) * 0.15;
  eligibility -= Math.max(0, 90 - repaymentCapacity) * 0.2;
  const readinessScore = Math.max(15, Math.min(98, Math.round(eligibility)));

  // ------- Personal-planning indicators (uses savings) -------
  const emergencyFundScore = Math.max(10, Math.min(100, Math.round(emergencyFundMonths * 20)));

  const monthsToGoal =
    monthlySavings > 0
      ? Math.max(1, Math.round(Math.max(0, input.goalPrice - input.savings) / monthlySavings))
      : 999;

  const goalProbability = Math.max(
    5,
    Math.min(97, Math.round(100 - Math.max(0, monthsToGoal - input.targetMonths) * 4))
  );

  const personalPlanningScore = Math.max(
    15,
    Math.min(
      98,
      Math.round(
        emergencyFundScore * 0.35 +
          goalProbability * 0.35 +
          budgetEfficiency * 0.15 +
          stability * 0.15
      )
    )
  );

  const risk: AnalysisResult["riskLevel"] =
    readinessScore >= 75 ? "منخفض" : readinessScore >= 55 ? "متوسط" : readinessScore >= 35 ? "مرتفع" : "حرج";

  return {
    readinessScore,
    personalPlanningScore,
    debtRatio: Math.round(debtRatio),
    expenseRatio: Math.round(expenseRatio),
    budgetEfficiency: Math.round(budgetEfficiency),
    financialStability: Math.round(stability),
    repaymentCapacity,
    incomeConsistency,
    emergencyFund: emergencyFundScore,
    goalAchievementProbability: goalProbability,
    monthlySavings: Math.round(monthlySavings),
    goalMonthsToReach: monthsToGoal >= 999 ? 999 : monthsToGoal,
    disposableIncome: Math.round(disposable),
    financialLeakage: Math.round(leakage),
    riskLevel: risk,
    executiveSummary:
      "أهلية التمويل المصرفي محسوبة من مؤشرات يمكن للبنك التحقق منها (الدخل، المصاريف، الالتزامات، الاستقرار، القدرة على السداد) بمعزل عن المدخرات المُدخلة يدوياً. المدخرات مستخدمة فقط للتخطيط الشخصي.",
    strengths: [
      "دخل شهري ثابت يوفر أساساً مالياً مستقراً",
      "نسبة التزامات تتيح هامش سداد شهري مقبول",
      "قدرة على تخصيص جزء شهري لتنفيذ الأهداف",
    ],
    weaknesses: [
      "توجد مصروفات قابلة للتقليل في الترفيه والمطاعم يمكن توجيهها للادخار",
      "المصاريف الأساسية قريبة من سقف الدخل مما يقلل مرونة السداد",
      "الاعتماد على المدخرات لا يُؤخذ بالحسبان عند التقييم المصرفي",
    ],
    recommendations: [
      "خفض المصاريف الثابتة لرفع القدرة على السداد ضمن معايير البنك",
      "الحفاظ على نسبة التزامات أقل من 30٪ من الدخل الشهري",
      "توجيه فائض الدخل نحو الأهداف الشخصية دون الاعتماد على الاقتراض",
      "بناء مدخرات شخصية للطوارئ (لأغراض التخطيط الشخصي وليس لتقييم البنك)",
    ],
    monthlyPlan: [
      "تخصيص 50٪ للاحتياجات الأساسية",
      "تخصيص 20٪ للادخار وسداد الديون",
      "تخصيص 20٪ لهدف الشراء المستقبلي",
      "تخصيص 10٪ للترفيه والاستمتاع",
    ],
    warnings: [
      "احرص على عدم زيادة نسبة الديون فوق 30٪ من الدخل",
      "المدخرات الشخصية المُدخلة لا تُحتسب في أهلية التمويل المصرفي",
    ],
    finalAdvice:
      "استخدم درجة التخطيط الشخصي لمتابعة أهدافك، واستخدم أهلية التمويل المصرفي لتقييم واقعي لفرص القبول لدى البنك.",
  };
}

export async function runAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const fallback = heuristicAnalysis(input);

  try {
    const prompt = `أنت محلل مالي في منصة Trayyath المصرفية. حلّل بيانات العميل بالريال السعودي:
- الراتب الشهري: ${input.salary}
- المصاريف الشهرية: ${input.expenses}
- الديون الحالية: ${input.debts}
- المدخرات المُدخلة يدوياً (للتخطيط الشخصي فقط): ${input.savings}
- مصاريف المطاعم: ${input.restaurants}
- مصاريف الترفيه: ${input.entertainment}
- الهدف المالي: ${input.goal}
- تكلفة الهدف: ${input.goalPrice}
- الأشهر المستهدفة: ${input.targetMonths}

قاعدة صارمة: احسب "readinessScore" (أهلية التمويل المصرفي) من مؤشرات يستطيع البنك التحقق منها فقط
(الدخل، المصاريف، الديون، نسبة الالتزامات، الاستقرار المالي، القدرة على السداد، اتساق الدخل).
لا تُدخل المدخرات ولا صندوق الطوارئ في هذا السكور. المدخرات تُستخدم فقط لحساب
"personalPlanningScore" و"emergencyFund" و"goalAchievementProbability".

أعِد JSON فقط:
{
  "readinessScore": (0-100) — أهلية التمويل المصرفي، بدون احتساب المدخرات,
  "personalPlanningScore": (0-100) — درجة التخطيط الشخصي مع احتساب المدخرات والهدف,
  "debtRatio": (0-100),
  "expenseRatio": (0-100),
  "budgetEfficiency": (0-100),
  "financialStability": (0-100),
  "repaymentCapacity": (0-100),
  "incomeConsistency": (0-100),
  "emergencyFund": (0-100) — مبني على المدخرات,
  "goalAchievementProbability": (0-100),
  "monthlySavings": رقم,
  "goalMonthsToReach": رقم,
  "disposableIncome": رقم,
  "financialLeakage": رقم,
  "riskLevel": "منخفض" أو "متوسط" أو "مرتفع" أو "حرج",
  "executiveSummary": "ملخص من 3 أسطر يشرح الفرق بين أهلية التمويل والتخطيط الشخصي",
  "strengths": ["نقطة قوة 1","نقطة قوة 2","نقطة قوة 3"],
  "weaknesses": ["نقطة ضعف 1","نقطة ضعف 2","نقطة ضعف 3"],
  "recommendations": ["توصية 1","توصية 2","توصية 3","توصية 4"],
  "monthlyPlan": ["بند 1","بند 2","بند 3","بند 4"],
  "warnings": ["تحذير 1","تحذير 2"],
  "finalAdvice": "نصيحة نهائية شاملة"
}`;

    const ai = await generateJson<AnalysisResult>(prompt);
    return {
      ...fallback,
      ...ai,
      readinessScore: clamp(ai.readinessScore, 0, 100, fallback.readinessScore),
      personalPlanningScore: clamp(ai.personalPlanningScore, 0, 100, fallback.personalPlanningScore),
      debtRatio: clamp(ai.debtRatio, 0, 100, fallback.debtRatio),
      expenseRatio: clamp(ai.expenseRatio, 0, 100, fallback.expenseRatio),
      budgetEfficiency: clamp(ai.budgetEfficiency, 0, 100, fallback.budgetEfficiency),
      financialStability: clamp(ai.financialStability, 0, 100, fallback.financialStability),
      repaymentCapacity: clamp(ai.repaymentCapacity, 0, 100, fallback.repaymentCapacity),
      incomeConsistency: clamp(ai.incomeConsistency, 0, 100, fallback.incomeConsistency),
      emergencyFund: clamp(ai.emergencyFund, 0, 100, fallback.emergencyFund),
      goalAchievementProbability: clamp(
        ai.goalAchievementProbability,
        0,
        100,
        fallback.goalAchievementProbability
      ),
    };
  } catch (err) {
    console.warn("Gemini analysis failed, using heuristic:", err);
    return fallback;
  }
}

function clamp(v: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}

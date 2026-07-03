import { AnalyzeRequestBody, FinancialMetrics } from "../types";

/**
 * كل الحسابات المالية تتم هنا فقط داخل الـ Backend.
 * Gemini لا يقوم بأي عملية حسابية، هو فقط يحلل النتائج الجاهزة.
 */
export function calculateFinancialMetrics(
  input: AnalyzeRequestBody
): FinancialMetrics {
  const {
    monthlySalary,
    monthlyExpenses,
    monthlyDebts,
    restaurantSpending,
    entertainmentSpending,
  } = input;

  // Saving = Salary - Expenses - Debts
  const saving = monthlySalary - monthlyExpenses - monthlyDebts;

  // Saving Rate = (Saving / Salary) x 100
  const savingRate =
    monthlySalary > 0 ? (saving / monthlySalary) * 100 : 0;

  // Financial Leakage = ((Restaurant + Entertainment) / Salary) x 100
  const financialLeakage =
    monthlySalary > 0
      ? ((restaurantSpending + entertainmentSpending) / monthlySalary) * 100
      : 0;

  // Financial Readiness Score: يبدأ من 100 ثم يُخصم منه
  let score = 100;

  if (savingRate < 20) {
    score -= 20;
  }

  if (financialLeakage > 20) {
    score -= 20;
  }

  if (saving < 0) {
    score -= 40;
  }

  // النتيجة يجب أن تبقى بين 0 و100
  score = Math.max(0, Math.min(100, score));

  return {
    saving: roundToTwo(saving),
    savingRate: roundToTwo(savingRate),
    financialLeakage: roundToTwo(financialLeakage),
    financialReadinessScore: score,
  };
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

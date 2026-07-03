import { AnalyzeFormData, AnalyzeResponseBody } from "./types";

export async function analyzeFinancialStatus(
  form: AnalyzeFormData
): Promise<AnalyzeResponseBody> {
  const payload = {
    monthlySalary: Number(form.monthlySalary),
    monthlyExpenses: Number(form.monthlyExpenses),
    monthlyDebts: Number(form.monthlyDebts),
    restaurantSpending: Number(form.restaurantSpending),
    entertainmentSpending: Number(form.entertainmentSpending),
    financialGoal: form.financialGoal,
    goalPrice: Number(form.goalPrice),
    desiredMonths: Number(form.desiredMonths),
  };

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody && typeof errorBody.error === "string"
        ? errorBody.error
        : `فشل الطلب برمز الحالة ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as AnalyzeResponseBody;
}

export interface AnalyzeRequestBody {
  monthlySalary: number;
  monthlyExpenses: number;
  monthlyDebts: number;
  restaurantSpending: number;
  entertainmentSpending: number;
  financialGoal: string;
  goalPrice: number;
  desiredMonths: number;
}

export interface FinancialMetrics {
  saving: number;
  savingRate: number;
  financialLeakage: number;
  financialReadinessScore: number;
}

export type RiskLevel = "Low" | "Medium" | "High";
export type Decision = "Proceed" | "Delay" | "Reconsider";

export interface GeminiAnalysis {
  behaviorAnalysis: string;
  recommendations: string[];
  decision: Decision;
  riskLevel: RiskLevel;
}

export interface AnalyzeResponseBody {
  metrics: FinancialMetrics;
  analysis: GeminiAnalysis;
}

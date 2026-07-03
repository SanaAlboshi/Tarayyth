export interface AnalyzeFormData {
  monthlySalary: string;
  monthlyExpenses: string;
  monthlyDebts: string;
  restaurantSpending: string;
  entertainmentSpending: string;
  financialGoal: string;
  goalPrice: string;
  desiredMonths: string;
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

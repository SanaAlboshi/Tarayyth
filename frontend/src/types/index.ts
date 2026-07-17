// ------- Goals (multi-goal savings allocation) -------
export type GoalPriority = "high" | "medium" | "low";

export interface Goal {
  id: string;
  name: string;
  targetPrice: number;
  allocated: number;
  monthlyAllocation?: number;
  priority: GoalPriority;
  targetDate?: string; // ISO
  completed: boolean;
  primary: boolean;
  createdAt: string;
}

export interface GoalAllocationSuggestion {
  goalId: string;
  amount: number;
  reason?: string;
}

export interface UserProfile {
  fullName: string;
  nationalId: string;
  email: string;
  phone: string;
  monthlySalary: number;
  optionalSavings: number;
  createdAt: string;
}

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
  readinessScore: number;
  debtRatio: number;
  expenseRatio: number;
  budgetEfficiency: number;
  financialStability: number;
  repaymentCapacity: number;
  incomeConsistency: number;
  personalPlanningScore: number;
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

export type ScenarioKey =
  | "salary_drop_20"
  | "unexpected_expense"
  | "new_loan"
  | "marriage"
  | "baby"
  | "inflation"
  | "job_loss";

export interface ScenarioOutcome {
  scenario: ScenarioKey;
  title: string;
  description: string;
  oldScore: number;
  newScore: number;
  oldRisk: string;
  newRisk: string;
  probability: number;
  advice: string;
  aiExplanation: string;
  impactTimeline: { month: number; score: number }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  severity: "info" | "warn" | "danger" | "ok";
  read: boolean;
}

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

export type PlanStatus = "ahead" | "on_track" | "behind";

export interface WhatIfPoint {
  monthlyAmount: number;
  months: number;
  completionDate: string;
}

export interface MonthlyProgressPoint {
  label: string;
  planned: number;
  actual: number;
}

export interface PlanCoachTip {
  title: string;
  body: string;
  tone: "ok" | "warn" | "info" | "danger";
}

export type CheckinStatus = "ahead" | "on_track" | "behind";

export interface CheckinFeedback {
  status: CheckinStatus;
  headline: string;
  message: string;
  recommendation: string;
}

export interface CheckinAllocation {
  goalId: string;
  goalName: string;
  amount: number;
}

export interface CheckinRecord {
  id: string;
  createdAt: string;
  monthKey: string; // e.g. "2026-07"
  savedThisMonth: number;
  incomeChanged: boolean;
  newObligations: boolean;
  goalChanged: boolean;
  feedback: CheckinFeedback;
  allocations?: CheckinAllocation[];
}

export interface SavingsPlanResult {
  goal: string;
  goalPrice: number;
  currentSavings: number;
  remainingAmount: number;
  targetMonths: number;
  recommendedMonthly: number;
  actualMonthly: number;
  monthsRemaining: number;
  estimatedCompletionDate: string;
  progressPercent: number;
  expectedProgressPercent: number;
  driftMonths: number;
  status: PlanStatus;
  whatIf: WhatIfPoint[];
  monthlyProgress: MonthlyProgressPoint[];
  headline: string;
  tips: PlanCoachTip[];
}

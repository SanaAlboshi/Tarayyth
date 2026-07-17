import { generateJson } from "./gemini";
import { AnalysisInput, AnalysisResult } from "./analysis";

export interface SavingsPlanRequest {
  input: AnalysisInput;
  result: AnalysisResult;
  history: {
    createdAt: string;
    monthlySavings: number;
    savings: number;
  }[];
  startedAt?: string;
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

export interface CoachTip {
  title: string;
  body: string;
  tone: "ok" | "warn" | "info" | "danger";
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
  tips: CoachTip[];
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

function projectDate(months: number, from: Date): string {
  if (!Number.isFinite(months)) return "—";
  return new Date(from.getTime() + months * MS_PER_MONTH).toISOString();
}

function statusOf(driftMonths: number): PlanStatus {
  if (driftMonths <= -0.5) return "ahead";
  if (driftMonths >= 0.5) return "behind";
  return "on_track";
}

function heuristic(req: SavingsPlanRequest): SavingsPlanResult {
  const { input, result, history, startedAt } = req;
  const now = new Date();
  const started = startedAt
    ? new Date(startedAt)
    : history.length > 0
    ? new Date(history[0].createdAt)
    : now;
  const monthsElapsed = Math.max(0, (now.getTime() - started.getTime()) / MS_PER_MONTH);

  const goalPrice = Math.max(0, input.goalPrice);
  const targetMonths = Math.max(1, input.targetMonths);
  const currentSavings = Math.max(0, input.savings);
  const remainingAmount = Math.max(0, goalPrice - currentSavings);

  const recommendedMonthly = Math.max(0, Math.round(remainingAmount / targetMonths));

  const actualMonthly =
    history.length > 0
      ? Math.round(
          history.reduce((s, h) => s + Math.max(0, h.monthlySavings), 0) / history.length
        )
      : result.monthlySavings;

  const monthsRemaining =
    actualMonthly > 0 ? remainingAmount / actualMonthly : remainingAmount > 0 ? Infinity : 0;

  const progressPercent =
    goalPrice > 0 ? Math.min(100, Math.max(0, (currentSavings / goalPrice) * 100)) : 0;

  const expectedProgressPercent = Math.min(
    100,
    Math.max(0, (Math.min(monthsElapsed, targetMonths) / targetMonths) * 100)
  );

  const expectedSavings = (Math.min(monthsElapsed, targetMonths) / targetMonths) * goalPrice;
  const savingsGap = expectedSavings - currentSavings;
  const driftMonths =
    actualMonthly > 0 ? savingsGap / actualMonthly : savingsGap > 0 ? 6 : 0;
  const status = statusOf(driftMonths);

  const estimatedCompletionDate = Number.isFinite(monthsRemaining)
    ? projectDate(monthsRemaining, now)
    : "—";

  // Client-relevant what-if amounts: a "low/mid/high" cross-section derived from
  // the user's recommended monthly rate so numbers feel personal.
  const seed = Math.max(500, Math.round(recommendedMonthly / 500) * 500 || 1000);
  const amounts = [
    Math.max(500, Math.round((seed - 1000) / 500) * 500 || 500),
    seed,
    seed + 1000,
    seed + 2000,
  ];
  const whatIf: WhatIfPoint[] = amounts.map((m) => {
    const months = m > 0 ? Math.round(remainingAmount / m) : Infinity;
    return {
      monthlyAmount: m,
      months: Number.isFinite(months) ? months : 999,
      completionDate: Number.isFinite(months) ? projectDate(months, now) : "—",
    };
  });

  // Monthly progress: build from history when available; otherwise show the
  // current single-month snapshot and the planned line.
  const arabicMonths = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];
  const monthlyProgress: MonthlyProgressPoint[] =
    history.length > 0
      ? history.map((h) => {
          const d = new Date(h.createdAt);
          return {
            label: arabicMonths[d.getMonth()],
            planned: recommendedMonthly,
            actual: Math.max(0, h.monthlySavings),
          };
        })
      : [
          {
            label: arabicMonths[now.getMonth()],
            planned: recommendedMonthly,
            actual: Math.max(0, result.monthlySavings),
          },
        ];

  const headline =
    status === "behind"
      ? "أنت متأخر قليلاً عن خطتك — دعنا نعيدك إلى المسار"
      : status === "ahead"
      ? "أداء ممتاز! أنت متقدم على خطتك"
      : "أنت على المسار الصحيح نحو هدفك";

  const tips: CoachTip[] = [];
  if (status === "behind") {
    const behind = Math.max(1, Math.round(driftMonths));
    tips.push({
      title: `أنت متأخر عن الخطة بحوالي ${behind} ${behind === 1 ? "شهر" : "أشهر"}`,
      body: `لتعويض ذلك، ارفع الادخار الشهري إلى ${Math.round(
        recommendedMonthly * 1.15
      ).toLocaleString("ar-SA")} ر.س لمدة 3 أشهر.`,
      tone: "warn",
    });
    if (input.restaurants >= 500) {
      const cut = 500;
      const monthsSaved =
        actualMonthly > 0 ? Math.max(1, Math.round((cut * 6) / actualMonthly)) : 1;
      tips.push({
        title: `تقليل مصاريف المطاعم بمقدار 500 ر.س شهرياً`,
        body: `يقربك من هدفك بحوالي ${monthsSaved} ${monthsSaved === 1 ? "شهر" : "أشهر"} إضافية.`,
        tone: "info",
      });
    }
  } else if (status === "ahead") {
    const ahead = Math.max(1, Math.round(-driftMonths));
    tips.push({
      title: `أنت متقدم بحوالي ${ahead} ${ahead === 1 ? "شهر" : "أشهر"} على خطتك`,
      body: "حافظ على نفس المعدل، أو خصّص جزءاً من الفائض لصندوق طوارئ.",
      tone: "ok",
    });
  } else {
    tips.push({
      title: "أنت على المسار الصحيح",
      body: `استمر بمعدل ${actualMonthly.toLocaleString(
        "ar-SA"
      )} ر.س شهرياً للوصول إلى هدفك في موعده.`,
      tone: "ok",
    });
    tips.push({
      title: "احتياطي أمان",
      body: "أضِف 5٪ إضافية شهرياً لبناء هامش أمان في حال تغيّرت ظروفك.",
      tone: "info",
    });
  }

  if (result.debtRatio > 30) {
    tips.push({
      title: "نسبة الالتزامات مرتفعة",
      body: "تقليل الديون يزيد قدرتك على الادخار ويسرّع بلوغ هدفك.",
      tone: "danger",
    });
  }

  return {
    goal: input.goal || "الهدف المالي",
    goalPrice,
    currentSavings,
    remainingAmount,
    targetMonths,
    recommendedMonthly,
    actualMonthly,
    monthsRemaining:
      Number.isFinite(monthsRemaining) ? Math.round(monthsRemaining * 10) / 10 : 999,
    estimatedCompletionDate,
    progressPercent: Math.round(progressPercent),
    expectedProgressPercent: Math.round(expectedProgressPercent),
    driftMonths: Math.round(driftMonths * 10) / 10,
    status,
    whatIf,
    monthlyProgress,
    headline,
    tips,
  };
}

export async function buildSavingsPlan(req: SavingsPlanRequest): Promise<SavingsPlanResult> {
  const fallback = heuristic(req);

  try {
    const prompt = `أنت مدرّب مالي شخصي في منصة Trayyath. اقترح توصيات لخطة الادخار الذكية.
الهدف: "${fallback.goal}" بقيمة ${fallback.goalPrice} ريال خلال ${fallback.targetMonths} شهر.
- المدخرات الحالية: ${fallback.currentSavings}
- الادخار المطلوب شهرياً: ${fallback.recommendedMonthly}
- الادخار الفعلي (متوسط): ${fallback.actualMonthly}
- التقدم الحالي: ${fallback.progressPercent}٪
- الحالة: ${fallback.status === "behind" ? "متأخر" : fallback.status === "ahead" ? "متقدم" : "على المسار"}
- انحراف عن الخطة: ${fallback.driftMonths} شهر
- مصاريف المطاعم: ${req.input.restaurants} ريال، الترفيه: ${req.input.entertainment} ريال

أعِد JSON فقط:
{
  "headline": "عنوان قصير تحفيزي",
  "tips": [
    { "title":"عنوان","body":"نص عملي فيه أرقام","tone":"ok"|"warn"|"info"|"danger" },
    ... 3-5 نصائح
  ]
}`;

    const ai = await generateJson<{ headline?: string; tips?: CoachTip[] }>(prompt);
    return {
      ...fallback,
      headline: ai.headline?.trim() || fallback.headline,
      tips:
        Array.isArray(ai.tips) && ai.tips.length > 0
          ? ai.tips
              .filter((t): t is CoachTip => !!t && typeof t.title === "string" && typeof t.body === "string")
              .map((t) => ({
                title: t.title,
                body: t.body,
                tone:
                  t.tone === "ok" || t.tone === "warn" || t.tone === "info" || t.tone === "danger"
                    ? t.tone
                    : "info",
              }))
          : fallback.tips,
    };
  } catch (err) {
    console.warn("Savings plan AI failed, using heuristic", err);
    return fallback;
  }
}

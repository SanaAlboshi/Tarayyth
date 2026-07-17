import { generateJson } from "./gemini";
import { AnalysisInput, AnalysisResult } from "./analysis";

export type CoachStatus = "ahead" | "on_track" | "behind";

export interface CoachHistoryItem {
  createdAt: string;
  monthlySavings: number;
  savings: number;
}

export interface CoachRequest {
  input: AnalysisInput;
  result: AnalysisResult;
  history: CoachHistoryItem[];
  startedAt?: string;
}

export interface CoachTip {
  title: string;
  body: string;
  tone: "ok" | "warn" | "info" | "danger";
}

export interface CoachResult {
  goal: string;
  goalPrice: number;
  targetMonths: number;
  monthsElapsed: number;
  monthsRemaining: number;
  currentSavings: number;
  requiredMonthlySavings: number;
  actualMonthlySavings: number;
  progressPercent: number;
  expectedProgressPercent: number;
  driftMonths: number;
  status: CoachStatus;
  estimatedCompletionDate: string;
  headline: string;
  tips: CoachTip[];
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

function statusOf(driftMonths: number): CoachStatus {
  if (driftMonths <= -0.5) return "ahead";
  if (driftMonths >= 0.5) return "behind";
  return "on_track";
}

function projectedCompletion(
  remainingAmount: number,
  actualMonthlySavings: number,
  fromDate: Date
): { months: number; date: string } {
  if (remainingAmount <= 0) {
    return { months: 0, date: fromDate.toISOString() };
  }
  if (actualMonthlySavings <= 0) {
    return { months: Infinity, date: "—" };
  }
  const months = remainingAmount / actualMonthlySavings;
  const date = new Date(fromDate.getTime() + months * MS_PER_MONTH);
  return { months, date: date.toISOString() };
}

function heuristicCoach(req: CoachRequest): CoachResult {
  const { input, result, history, startedAt } = req;
  const now = new Date();
  const started = startedAt ? new Date(startedAt) : history.length > 0 ? new Date(history[0].createdAt) : now;
  const elapsedMs = Math.max(0, now.getTime() - started.getTime());
  const monthsElapsed = elapsedMs / MS_PER_MONTH;

  const goalPrice = Math.max(0, input.goalPrice);
  const targetMonths = Math.max(1, input.targetMonths);
  const currentSavings = Math.max(0, input.savings);
  const actualMonthlySavings =
    history.length > 0
      ? Math.round(
          history.reduce((s, h) => s + Math.max(0, h.monthlySavings), 0) / history.length
        )
      : result.monthlySavings;

  const requiredMonthlySavings = Math.round(goalPrice / targetMonths);
  const progressPercent =
    goalPrice > 0 ? Math.min(100, Math.max(0, (currentSavings / goalPrice) * 100)) : 0;
  const expectedProgressPercent = Math.min(
    100,
    Math.max(0, (Math.min(monthsElapsed, targetMonths) / targetMonths) * 100)
  );

  const expectedSavings = (Math.min(monthsElapsed, targetMonths) / targetMonths) * goalPrice;
  const savingsGap = expectedSavings - currentSavings;
  const driftMonths =
    actualMonthlySavings > 0 ? savingsGap / actualMonthlySavings : savingsGap > 0 ? 6 : 0;

  const remainingAmount = Math.max(0, goalPrice - currentSavings);
  const projection = projectedCompletion(remainingAmount, actualMonthlySavings, now);
  const monthsRemaining = projection.months;

  const status = statusOf(driftMonths);

  const tips: CoachTip[] = [];
  if (status === "behind") {
    const behind = Math.max(1, Math.round(driftMonths));
    tips.push({
      title: `أنت متأخر عن خطة الادخار بحوالي ${behind} ${behind === 1 ? "شهر" : "أشهر"}`,
      body: `للعودة إلى المسار، ارفع الادخار الشهري إلى ${Math.round(
        requiredMonthlySavings * 1.15
      ).toLocaleString("ar-SA")} ر.س لمدة 3 أشهر.`,
      tone: "warn",
    });
    if (input.restaurants > 0) {
      const cut = Math.round(input.restaurants * 0.15);
      const monthsSaved = cut > 0 && actualMonthlySavings > 0
        ? Math.round((cut * 6) / actualMonthlySavings) || 1
        : 1;
      tips.push({
        title: `تقليل مصاريف المطاعم بنسبة 15٪`,
        body: `يوفّر لك ${cut.toLocaleString("ar-SA")} ر.س شهرياً ويقربك من هدفك بحوالي ${monthsSaved} شهر.`,
        tone: "info",
      });
    }
    tips.push({
      title: "راجع الاشتراكات الشهرية",
      body: "ألغِ ما لا تستخدمه فعلياً — قد يوفر ذلك 3-5٪ من دخلك بلا جهد.",
      tone: "info",
    });
  } else if (status === "ahead") {
    const ahead = Math.max(1, Math.round(-driftMonths));
    tips.push({
      title: `عمل رائع! أنت متقدم بحوالي ${ahead} ${ahead === 1 ? "شهر" : "أشهر"} عن خطتك`,
      body: "استمر بنفس الوتيرة أو خصّص جزءاً من الفائض لصندوق طوارئ متين.",
      tone: "ok",
    });
    tips.push({
      title: "استثمر السرعة",
      body: `يمكنك تقريب الهدف بحوالي ${Math.round(
        actualMonthlySavings / Math.max(1, requiredMonthlySavings)
      )} شهر إذا حافظت على المعدل الحالي.`,
      tone: "info",
    });
  } else {
    tips.push({
      title: "أنت على المسار الصحيح",
      body: `استمر في الادخار بمعدل ${actualMonthlySavings.toLocaleString(
        "ar-SA"
      )} ر.س شهرياً للوصول إلى هدفك في الموعد المحدد.`,
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
      body: "تقليل الديون يزيد قدرتك على الادخار ويحسن أهلية التمويل لاحقاً.",
      tone: "danger",
    });
  }

  const headline =
    status === "behind"
      ? "أنت متأخر قليلاً عن خطتك — دعنا نعيدك إلى المسار"
      : status === "ahead"
      ? "أداء ممتاز! أنت متقدم على خطتك"
      : "أنت على المسار الصحيح نحو هدفك";

  return {
    goal: input.goal || "الهدف المالي",
    goalPrice,
    targetMonths,
    monthsElapsed: Math.round(monthsElapsed * 10) / 10,
    monthsRemaining:
      Number.isFinite(monthsRemaining) ? Math.round(monthsRemaining * 10) / 10 : 999,
    currentSavings,
    requiredMonthlySavings,
    actualMonthlySavings,
    progressPercent: Math.round(progressPercent),
    expectedProgressPercent: Math.round(expectedProgressPercent),
    driftMonths: Math.round(driftMonths * 10) / 10,
    status,
    estimatedCompletionDate: projection.date,
    headline,
    tips,
  };
}

export async function coachInsights(req: CoachRequest): Promise<CoachResult> {
  const fallback = heuristicCoach(req);

  try {
    const prompt = `أنت مدرّب مالي شخصي في منصة Trayyath. الهدف: "${fallback.goal}" بقيمة ${fallback.goalPrice} ريال خلال ${fallback.targetMonths} شهر.
حالة العميل الآن:
- المدخرات الحالية: ${fallback.currentSavings} ريال
- الادخار الشهري الفعلي (متوسط): ${fallback.actualMonthlySavings} ريال
- الادخار المطلوب شهرياً: ${fallback.requiredMonthlySavings} ريال
- التقدم الفعلي: ${fallback.progressPercent}٪
- التقدم المتوقع في هذا الوقت: ${fallback.expectedProgressPercent}٪
- الانحراف عن الخطة: ${fallback.driftMonths} شهر (${fallback.status === "behind" ? "متأخر" : fallback.status === "ahead" ? "متقدم" : "على المسار"})
- مصاريف المطاعم: ${req.input.restaurants} ريال، الترفيه: ${req.input.entertainment} ريال
- نسبة الالتزامات: ${req.result.debtRatio}٪

أعد JSON فقط بالبنية التالية باللغة العربية، بحيث تكون النصائح مخصصة وعملية:
{
  "headline": "عنوان قصير عاطفي وتحفيزي (سطر واحد)",
  "tips": [
    { "title": "عنوان النصيحة", "body": "نص عملي قابل للتنفيذ يحتوي أرقاماً حين يمكن", "tone": "ok" أو "warn" أو "info" أو "danger" },
    ... 3 إلى 5 نصائح
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
    console.warn("Coach AI failed, using heuristic", err);
    return fallback;
  }
}

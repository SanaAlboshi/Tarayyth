import { generateJson } from "./gemini";

export type CheckinDelta = "ahead" | "on_track" | "behind";
export type CheckinMood = "excellent" | "good" | "average" | "difficult";
export type MonthlyEvent =
  | "none"
  | "salary_up"
  | "salary_down"
  | "bonus"
  | "extra_income"
  | "new_commitments"
  | "loan_paid_off"
  | "unexpected_expense"
  | "other";

export interface CheckinRequest {
  goal: string;
  goalPrice: number;
  currentSavings: number;
  savedThisMonth: number;
  plannedMonthly: number;
  monthsRemainingBefore: number;
  monthsRemainingAfter: number;
  mood?: CheckinMood;
  event?: MonthlyEvent;
  eventAmount?: number;
  // Legacy fields still supported by older callers.
  incomeChanged?: boolean;
  newObligations?: boolean;
  goalChanged?: boolean;
}

export interface CheckinFeedback {
  status: CheckinDelta;
  headline: string;
  message: string;
  recommendation: string;
}

function statusOf(saved: number, planned: number): CheckinDelta {
  const gap = saved - planned;
  if (planned <= 0) return "on_track";
  if (gap >= planned * 0.15) return "ahead";
  if (gap <= -planned * 0.15) return "behind";
  return "on_track";
}

const EVENT_LABEL: Record<MonthlyEvent, string> = {
  none: "لا شيء تغيّر",
  salary_up: "زيادة في الراتب",
  salary_down: "تخفيض في الراتب",
  bonus: "مكافأة",
  extra_income: "دخل إضافي",
  new_commitments: "التزامات شهرية جديدة",
  loan_paid_off: "سداد قرض",
  unexpected_expense: "مصروف غير متوقع",
  other: "حدث آخر",
};

const MOOD_LABEL: Record<CheckinMood, string> = {
  excellent: "ممتاز",
  good: "جيد",
  average: "متوسط",
  difficult: "صعب",
};

function heuristic(req: CheckinRequest): CheckinFeedback {
  const status = statusOf(req.savedThisMonth, req.plannedMonthly);
  const delta = Math.round(req.monthsRemainingBefore - req.monthsRemainingAfter);
  const saved = req.savedThisMonth.toLocaleString("ar-SA");
  const planned = req.plannedMonthly.toLocaleString("ar-SA");

  if (status === "ahead") {
    return {
      status,
      headline: "أداء ممتاز هذا الشهر!",
      message: `ادخرت ${saved} ر.س (${
        req.plannedMonthly ? `أعلى من المستهدف ${planned} ر.س` : "أعلى من المتوسط"
      }). بهذا المعدل قد تصل إلى هدفك ${
        delta > 0 ? `${delta} شهر أقرب` : "قبل الموعد"
      }.`,
      recommendation:
        req.event === "bonus" || req.event === "extra_income"
          ? "خصّص جزءاً من الدخل الإضافي لصندوق طوارئ يعادل شهرين من المصاريف."
          : "حافظ على نفس المعدل الشهر القادم.",
    };
  }

  if (status === "behind") {
    const shortfall = Math.max(0, req.plannedMonthly - req.savedThisMonth);
    const eventNote =
      req.event === "unexpected_expense"
        ? "طبيعي مع المصروف غير المتوقع — لا تقلق."
        : req.event === "salary_down"
        ? "مع تراجع الدخل، الأولوية هي حماية الأساسيات."
        : req.mood === "difficult"
        ? "شهر صعب مفهوم — الاستمرارية أهم من الكمال."
        : "";
    return {
      status,
      headline: eventNote || "ادخارك هذا الشهر أقل من الخطة",
      message: `ادخرت ${saved} ر.س من أصل ${planned} ر.س المستهدفة. قد يتأخر هدفك ${
        Math.abs(delta) > 0 ? `بحوالي ${Math.abs(delta)} شهر` : "قليلاً"
      }.`,
      recommendation:
        shortfall > 0
          ? `حاول تعويض ${shortfall.toLocaleString(
              "ar-SA"
            )} ر.س الشهر القادم عبر خفض المصاريف غير الأساسية.`
          : "راجع مصاريفك الشهرية وحدّد بنداً واحداً يمكن خفضه.",
    };
  }

  return {
    status,
    headline: "أنت على المسار الصحيح",
    message: `ادخار هذا الشهر ${saved} ر.س قريب من المستهدف ${planned} ر.س. استمر بنفس الوتيرة.`,
    recommendation:
      req.mood === "excellent" || req.mood === "good"
        ? "استمر بنفس الطاقة الشهر القادم."
        : "أضِف 5٪ إضافية شهرياً كهامش أمان.",
  };
}

export async function checkinFeedback(req: CheckinRequest): Promise<CheckinFeedback> {
  const fallback = heuristic(req);

  try {
    const eventLine = req.event ? EVENT_LABEL[req.event] : "لا شيء تغيّر";
    const moodLine = req.mood ? MOOD_LABEL[req.mood] : "غير محدد";
    const eventAmount =
      typeof req.eventAmount === "number" && req.eventAmount > 0
        ? ` بمبلغ ${req.eventAmount}`
        : "";

    const prompt = `أنت مدرّب مالي في منصة Trayyath. صمّم رسالة قصيرة ومشجعة عن أداء العميل هذا الشهر.
لا تلم العميل أبداً. النبرة داعمة وودّية.

- الهدف: ${req.goal}
- تكلفة الهدف: ${req.goalPrice}
- المدخرات الحالية: ${req.currentSavings}
- ادخار هذا الشهر: ${req.savedThisMonth}
- المستهدف الشهري: ${req.plannedMonthly}
- الأشهر المتبقية قبل التحديث: ${req.monthsRemainingBefore}
- الأشهر المتبقية بعد التحديث: ${req.monthsRemainingAfter}
- مزاج الشهر: ${moodLine}
- حدث هذا الشهر: ${eventLine}${eventAmount}

أعِد JSON فقط:
{
  "status": "ahead"|"on_track"|"behind",
  "headline": "عنوان قصير مشجّع",
  "message": "جملة توضح أثر التوفير على الجدول الزمني وتذكر الأرقام حين تنفع",
  "recommendation": "توصية واحدة قابلة للتنفيذ الشهر القادم"
}`;
    const ai = await generateJson<Partial<CheckinFeedback>>(prompt);
    return {
      status:
        ai.status === "ahead" || ai.status === "on_track" || ai.status === "behind"
          ? ai.status
          : fallback.status,
      headline: ai.headline?.trim() || fallback.headline,
      message: ai.message?.trim() || fallback.message,
      recommendation: ai.recommendation?.trim() || fallback.recommendation,
    };
  } catch (err) {
    console.warn("Check-in AI failed, using heuristic", err);
    return fallback;
  }
}

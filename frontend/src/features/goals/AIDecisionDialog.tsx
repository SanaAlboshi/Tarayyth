import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, AlertTriangle, ArrowLeft, Brain } from "lucide-react";
import { Modal } from "../../components/shared/Modal";
import { useAnalysis } from "../analysis/analysisStore";
import { useGoals } from "./goalsStore";
import { formatSAR } from "../../lib/format";

/* Bank palette (dialog-only) */
const BANK = {
  paper:    "#fcf8f5",
  ink:      "#02151e",
  inkAlt:   "#002134",
  muted:    "#3f3c3e",
  accent:   "#d58d79",
  ai:       "#837fd8",
  paperEdge:"#EDE7DE",
} as const;

export type PurchaseMotivation =
  | "necessity"
  | "desire"
  | "investment"
  | "offer"
  | "social"
  | "family"
  | "other";

/**
 * Effective motivation used by the AI analysis engine. For the six
 * predefined options this equals the selected motivation. For "other",
 * the free-text reason is classified into one of the predefined branches
 * when possible, or falls back to "neutral" for open-ended narratives.
 */
type EffectiveMotivation =
  | "necessity"
  | "desire"
  | "investment"
  | "offer"
  | "social"
  | "family"
  | "neutral";

interface MotivationOption {
  key: PurchaseMotivation;
  label: string;
  hint: string;
}

const MOTIVATIONS: MotivationOption[] = [
  { key: "necessity",  label: "حاجة أساسية",   hint: "قرار مبني على احتياج حقيقي." },
  { key: "desire",     label: "رغبة شخصية",    hint: "قرار مبني على تفضيل شخصي." },
  { key: "investment", label: "استثمار",       hint: "قرار يهدف لعائد مستقبلي." },
  { key: "offer",      label: "عرض مميز",      hint: "قرار مدفوع بفرصة أو خصم." },
  { key: "social",     label: "ضغط اجتماعي",   hint: "قرار متأثر بالمحيط الاجتماعي." },
  { key: "family",     label: "مناسبة عائلية", hint: "قرار مرتبط بمناسبة عائلية." },
  { key: "other",      label: "أخرى",          hint: "اشرح السبب بكلماتك الخاصة." },
];

/**
 * Classify a free-text reason to the closest predefined motivation.
 * Falls back to "neutral" when no clear signal is detected — the AI then
 * generates a neutral behavioral analysis based on the user's explanation
 * and financial situation.
 */
function classifyOther(reason: string): EffectiveMotivation {
  const t = reason.trim().toLowerCase();
  if (!t) return "neutral";

  // Family / gift / occasion
  if (
    /هدي(ة|ه)|هدايا|والد|أم|أب|أمي|أبي|زوج|زوجة|طفل|طفلة|أطفال|ابن|ابنة|أخ|أخت|جد|جدة|عائلة|أسرة|زواج|خطوبة|مولود|مناسبة/.test(
      t
    )
  ) {
    return "family";
  }

  // Education / study
  if (/دراس|جامع|كلي|مدرس|رسوم|شهادة|دورة|كورس|تعليم|بحث/.test(t)) {
    return "necessity";
  }

  // Health / medical / repair / basic necessity
  if (
    /علاج|طبيب|مستشفى|دواء|صحي|صحة|إصلاح|صيانة|أعطال|كسر|بديل|أساسي|ضروري|حاج(ة|ه)|احتياج/.test(
      t
    )
  ) {
    return "necessity";
  }

  // Business / investment / project
  if (
    /مشروع|عمل|شركة|تجار|استثمار|عائد|ربح|إنتاج|منشأة|فرع|مصنع|متجر|مورد|علامة|براند/.test(
      t
    )
  ) {
    return "investment";
  }

  // Offer / discount / deal
  if (
    /خصم|تخفيض|عرض|أوفر|فرصة|بروموشن|بلاك فرايدي|عيد|سيل|تصفية|قسط|أقساط/.test(
      t
    )
  ) {
    return "offer";
  }

  // Social pressure / peers / friends
  if (
    /زملاء|أصدقاء|صديق|زميل|جيران|جار|محيط|ضغط|مقارن|كلام الناس|يشوفون|يقولون|يعيّر|صورة|شكل|ستايل/.test(
      t
    )
  ) {
    return "social";
  }

  // Personal desire / like / want
  if (
    /أعجبني|عجبني|أحب|أحبه|أحبها|أريد|رغبة|أرغب|هوايا|هواية|شخصي|أشعر|أستمتع|متعة|سعادة/.test(
      t
    )
  ) {
    return "desire";
  }

  return "neutral";
}

export interface AIDecisionInput {
  /** Draft goal — same shape passed to useGoals().addGoal(). */
  draft: Parameters<ReturnType<typeof useGoals>["addGoal"]>[0];
}

interface Props {
  open: boolean;
  input: AIDecisionInput | null;
  onCancel: () => void;
  /** Fires when the user confirms the purchase after seeing the recommendation. */
  onConfirm: (motivation: PurchaseMotivation) => void;
}

type Verdict = "achievable" | "review" | "postpone";
type ReadinessTier = "low" | "mid" | "high";
type GoalSize = "small" | "medium" | "large";

function classifyGoalSize(targetPrice: number): GoalSize {
  if (targetPrice < 10000) return "small";
  if (targetPrice < 50000) return "medium";
  return "large";
}

interface MotivationInsight {
  /** Short title of the psychological framing. */
  title: string;
  /** 1-2 line explanation specific to this motivation. */
  body: string;
  /** Closing sentence conditioned on the user's readiness tier. */
  readinessContext: string;
}

interface AIDecision {
  verdict: Verdict;
  headline: string;
  body: string;
  reasons: string[];
  motivationInsight: MotivationInsight;
}

/**
 * Psychological analysis per motivation — always the same six branches
 * (spec-mandated), with the closing sentence tuned by readiness tier so the
 * same motivation reads differently for a person whose finances are strong
 * versus a person whose finances are stretched.
 */
function buildMotivationInsight(
  motivation: EffectiveMotivation,
  readinessTier: ReadinessTier,
  size: GoalSize,
  customReason?: string
): MotivationInsight {
  // Pick body length + tone by goal size:
  //   small  = short, light, encouraging framing.
  //   medium = balanced, neutral framing.
  //   large  = longer, firmer framing; stronger warnings when readiness is low.
  const pick = (small: string, medium: string, large: string) =>
    size === "small" ? small : size === "medium" ? medium : large;

  switch (motivation) {
    case "social": {
      const body = pick(
        "هذا الهدف بسيط، لكن تأكد أنه يعكس رغبتك الشخصية لا توقعات الآخرين.",
        "قد يكون هذا القرار مدفوعاً بضغط اجتماعي أكثر من كونه احتياجاً مالياً فعلياً. من الأفضل مراجعة أولوية الهدف قبل الالتزام به.",
        "قرار بهذا الحجم مدفوع بعوامل اجتماعية قد يترك أثراً طويل المدى على استقرارك المالي. راجع بموضوعية ما إذا كان يعكس أولوياتك الشخصية أم توقعات الآخرين قبل الالتزام."
      );
      const readinessContext = pick(
        readinessTier === "low"
          ? "جاهزيتك محدودة — تأكد أنه لا يزاحم أولويات أهم."
          : "لا يوجد ضغط مالي واضح، تحقق فقط من أنه اختيارك أنت.",
        readinessTier === "high"
          ? "جاهزيتك جيدة، ومع ذلك يُستحسن التحقق من أن القرار يعكس أولوياتك الشخصية."
          : readinessTier === "mid"
          ? "جاهزيتك متوسطة — أعِد ترتيب أولوية هذا الهدف قبل الالتزام لتفادي ضغط لاحق."
          : "جاهزيتك المالية محدودة — يُنصح بمراجعة أولوية هذا الهدف قبل الالتزام به.",
        readinessTier === "high"
          ? "جاهزيتك جيدة، لكن قرار بهذا الحجم يستحق تفكيراً مستقلاً عن آراء المحيط."
          : readinessTier === "mid"
          ? "بحجم هذا الالتزام، أي ضغط اجتماعي قد يُضرّ بخطتك المالية على المدى الطويل — يُفضّل التأني وإعادة التقييم."
          : "تحذير: قرار بهذا الحجم مع جاهزية مالية محدودة قد يُضعف استقرارك لسنوات. يُنصح بتأجيل الالتزام حتى تتحسن مؤشراتك."
      );
      return { title: "قرار متأثر بمحيطك الاجتماعي", body, readinessContext };
    }

    case "desire": {
      const body = pick(
        "الرغبات الشخصية طبيعية — استمتع بها ما دامت لا تؤثر على خطتك.",
        "الرغبات الشخصية جزء طبيعي من الحياة، لكن يُفضّل ألا يؤثر هذا الهدف سلباً على مستوى ادخارك أو استقرارك المالي.",
        "الرغبات الشخصية مشروعة، لكن قرار بهذا الحجم يستحق مراجعة دقيقة: هل يُحسّن جودة حياتك بشكل يستحق أثره على ادخارك واستقرارك خلال السنوات القادمة؟"
      );
      const readinessContext = pick(
        "أثره المالي محدود، تابع براحة.",
        readinessTier === "high"
          ? "قدرتك تسمح بذلك، تابع دون التأثير على مستوى ادخارك."
          : readinessTier === "mid"
          ? "يمكن تنفيذه بشرط عدم المساس بخطة الادخار."
          : "قدرتك محدودة — قد يؤخر بناء استقرارك، فكّر في تأجيله أو تقليل تكلفته.",
        readinessTier === "high"
          ? "قدرتك تسمح، لكن راجع أثره على أهدافك طويلة الأمد قبل الالتزام."
          : readinessTier === "mid"
          ? "بحجم هذا القرار، أي ضغط على الادخار سيتراكم على مدى أشهر — يُنصح بتمديد المدة أو تقليل التكلفة."
          : "تحذير: مع محدودية جاهزيتك، رغبة بهذا الحجم قد تكلّفك سنوات من التأخر في أهدافك الأخرى. يُفضّل التأجيل أو خفض الميزانية."
      );
      return { title: "رغبة شخصية", body, readinessContext };
    }

    case "necessity": {
      const body = pick(
        "احتياج بسيط ومبرّر — يمكن دمجه بسهولة في خطتك.",
        "هذا الهدف يعكس حاجة أساسية، وقد يستحق أولوية أعلى في خطتك المالية إذا سمحت قدرتك الحالية بذلك.",
        "احتياج بهذا الحجم يستحق التخطيط المدروس: أولوية أعلى في التوزيع الشهري، مع البحث عن أفضل تكلفة تحقق الغرض الأساسي دون إرهاق ماليتك."
      );
      const readinessContext = pick(
        "لا يوجد ضغط مالي واضح، امضِ به.",
        readinessTier === "high"
          ? "جاهزيتك تسمح بأولوية عالية دون قلق على استقرارك."
          : readinessTier === "mid"
          ? "استمر بخطة الادخار مع تخصيص جزء تدريجي للاحتياج الأساسي."
          : "يمكن منحه أولوية، مع البحث عن أقل تكلفة تحقق الحاجة.",
        readinessTier === "high"
          ? "جاهزيتك ممتازة — نفّذه بثقة مع الحفاظ على مستوى الادخار."
          : readinessTier === "mid"
          ? "بحجم هذا الاحتياج، وزّع الالتزام على فترة تناسب قدرتك الشهرية."
          : "احتياج مبرّر، لكن بحجمه الحالي يتطلب البحث عن بديل أوفر أو تجزئته لعدة مراحل."
      );
      return { title: "احتياج أساسي", body, readinessContext };
    }

    case "investment": {
      const body = pick(
        "استثمار صغير — تأكد فقط من فهم عائده المتوقع.",
        "قد يقدّم هذا الهدف قيمة مستقبلية، لكنه يتطلب جاهزية مالية كافية لاستيعاب المخاطر قبل المضي فيه.",
        "استثمار بهذا الحجم يتطلب تقييماً دقيقاً للمخاطر: تأكد من امتلاكك احتياطي طوارئ، ومن أن العائد المتوقع يبرّر المبلغ والمدة الملتزم بها."
      );
      const readinessContext = pick(
        "المبلغ صغير نسبياً، أي خسارة لن تؤثر جوهرياً.",
        readinessTier === "high"
          ? "جاهزيتك تدعم هذا القرار — تأكد فقط من فهم المخاطر."
          : readinessTier === "mid"
          ? "يُنصح ببناء صندوق طوارئ يغطي عدة أشهر قبل الالتزام."
          : "جاهزيتك غير كافية لتحمّل مخاطر استثمارية إضافية — يُفضّل تحسين المؤشرات الأساسية أولاً.",
        readinessTier === "high"
          ? "جاهزيتك ممتازة، ومع ذلك لا تعتمد على هذا الاستثمار كمصدر دخل رئيسي."
          : readinessTier === "mid"
          ? "استثمار بهذا الحجم يحتاج احتياطي طوارئ ثابت — أعِد التقييم بعد بنائه."
          : "تحذير: استثمار كبير بجاهزية محدودة قرار محفوف بمخاطر جوهرية. يُنصح بتأجيله حتى تتحسن مؤشراتك المالية الأساسية."
      );
      return { title: "قرار استثماري", body, readinessContext };
    }

    case "offer": {
      const body = pick(
        "عرض بسيط — تحقق فقط من الحاجة الفعلية للمنتج.",
        "العروض المحدودة قد تدفع لقرارات شراء اندفاعية. قيّم بموضوعية ما إذا كنت تحتاج فعلاً هذا الشراء أم أنك تشتري بسبب الخصم فقط.",
        "قرار شراء بهذا الحجم مدفوع بعرض قد يكون فخّاً نفسياً شائعاً. اسأل نفسك: هل كنت ستشتري هذا لو لم يكن هناك خصم؟ الخصم لا يبرّر التزاماً كبيراً غير مخطط له."
      );
      const readinessContext = pick(
        "أثره المالي محدود، لكن الحاجة الفعلية تبقى المعيار الأهم.",
        readinessTier === "high"
          ? "جاهزيتك جيدة — السؤال الأهم: هل تحتاجه فعلاً بغض النظر عن الخصم؟"
          : readinessTier === "mid"
          ? "قدرتك متوسطة — لا تسمح للعرض بتغيير ترتيب أولوياتك."
          : "جاهزيتك محدودة — الاستقرار المالي أهم من الخصم، ولو ضاع العرض.",
        readinessTier === "high"
          ? "جاهزيتك جيدة، لكن قرار بهذا الحجم يستحق التفكير خارج ضغط الوقت."
          : readinessTier === "mid"
          ? "بحجم هذا الالتزام، لا يجب أن يكون العرض هو المحرّك الأساسي — راجع الحاجة والقدرة أولاً."
          : "تحذير: التزام كبير مدفوع بخصم مع جاهزية محدودة قد يُدخلك في ديون طويلة الأمد. يُنصح بتأجيل القرار."
      );
      return { title: "عرض أو خصم مغرٍ", body, readinessContext };
    }

    case "family": {
      const body = pick(
        "مناسبة عائلية بحجم لطيف — تُنجَز غالباً دون أثر مالي.",
        "المناسبات العائلية مهمة، لكن يجب تحديد ميزانية معقولة لها حتى لا تؤثر على استقرارك المالي على المدى الطويل.",
        "مناسبة عائلية بهذا الحجم قد تخلق ضغطاً عاطفياً لتجاوز الميزانية. حدّد سقفاً واضحاً مسبقاً والتزم به، فالمناسبة تنتهي لكن أثرها المالي قد يستمر لأشهر."
      );
      const readinessContext = pick(
        "يمكن تنفيذها بسهولة ضمن مصاريفك الاعتيادية.",
        readinessTier === "high"
          ? "قدرتك تسمح — حدّد سقفاً للإنفاق لتبقى التجربة إيجابية."
          : readinessTier === "mid"
          ? "ضع ميزانية محددة سلفاً وتجنّب تجاوزها حفاظاً على خطة الادخار."
          : "جاهزيتك محدودة — يُفضّل خيار أبسط بميزانية أصغر للحفاظ على استقرارك.",
        readinessTier === "high"
          ? "قدرتك تسمح، لكن التزم بميزانية محددة سلفاً حتى لا تتراكم مصاريف المناسبة."
          : readinessTier === "mid"
          ? "بحجم هذا الالتزام، الخروج عن الميزانية قد يعطّل خطة ادخارك لأشهر."
          : "تحذير: مع محدودية جاهزيتك، مناسبة بهذا الحجم قد تُدخلك في التزامات جانبية. يُنصح بتقليل الميزانية بشكل جوهري."
      );
      return { title: "مناسبة عائلية", body, readinessContext };
    }

    case "neutral": {
      // Free-text reason we couldn't confidently classify — generate a
      // neutral behavioral framing based purely on the user's explanation
      // and financial situation.
      const trimmed = (customReason ?? "").trim();
      const quoted = trimmed.length > 0 ? `"${trimmed}"` : "";
      const body = pick(
        `سبب شخصي (${quoted}) بحجم بسيط — يمكن دمجه في خطتك دون أثر جوهري ما دام لا يزاحم أولوياتك الأخرى.`,
        `يعتمد الذكاء الاصطناعي على شرحك (${quoted}) لتوليد قراءة موضوعية. القرار قابل للتنفيذ إذا لم يؤثر على مستوى ادخارك واستقرارك المالي.`,
        `شرحت السبب بـ (${quoted})، وقرار بهذا الحجم يستحق تقييماً هادئاً: هل يبرّر السبب حجم الأثر المالي على أهدافك القادمة؟`
      );
      const readinessContext = pick(
        readinessTier === "low"
          ? "جاهزيتك محدودة — تأكد أن هذا السبب يبرّر التأخر في تحسين استقرارك."
          : "لا يوجد ضغط مالي واضح — تابع براحة.",
        readinessTier === "high"
          ? "قدرتك تسمح بذلك — تابع مع الحفاظ على مستوى الادخار."
          : readinessTier === "mid"
          ? "قدرتك متوسطة — نفّذه بشرط عدم المساس بخطة الادخار الشهرية."
          : "جاهزيتك محدودة — يُفضّل تأجيله أو تقليل تكلفته حفاظاً على استقرارك.",
        readinessTier === "high"
          ? "جاهزيتك جيدة، لكن راجع أثره على أهدافك طويلة الأمد قبل الالتزام."
          : readinessTier === "mid"
          ? "بحجم هذا الالتزام، تأكد أن السبب يبرّر ضغطاً محتملاً على خطتك لعدة أشهر."
          : "تحذير: مع محدودية جاهزيتك، التزام بهذا الحجم لسبب غير أساسي قد يُضعف استقرارك لفترة طويلة."
      );
      return {
        title:
          trimmed.length > 0
            ? "قراءة سلوكية للسبب المُدخل"
            : "قراءة سلوكية محايدة",
        body,
        readinessContext,
      };
    }
  }
}

/**
 * Decide whether a major purchase looks financially sound given:
 *   - The user's safe monthly savings capacity (from the analysis result)
 *   - The DTI, readiness score, and stability
 *   - The chosen motivation (weighs "social" more heavily as risky, "necessity"/"investment" as supportive)
 *   - The goal's target price relative to the user's yearly saving capacity
 */
function buildAIDecision(params: {
  targetPrice: number;
  monthlyCapacity: number;
  readinessScore: number;
  debtRatio: number;
  financialStability: number;
  motivation: PurchaseMotivation;
  priority: "high" | "medium" | "low";
  /** Free-text explanation when the user picked "أخرى". */
  customReason?: string;
}): AIDecision {
  const {
    targetPrice,
    monthlyCapacity,
    readinessScore,
    debtRatio,
    financialStability,
    motivation,
    priority,
    customReason,
  } = params;

  const size: GoalSize = classifyGoalSize(targetPrice);

  // Resolve the effective motivation used to weight the decision and
  // generate the psychological narrative. For "other" we classify the
  // free-text reason into the closest predefined branch, or "neutral"
  // when no clear signal is detected.
  const effectiveMotivation: EffectiveMotivation =
    motivation === "other" ? classifyOther(customReason ?? "") : motivation;

  // Years to reach target at the safe monthly capacity.
  const yearsNeeded =
    monthlyCapacity > 0 ? targetPrice / (monthlyCapacity * 12) : Infinity;

  // Financial signals — 0..3 negative points.
  let stress = 0;
  if (readinessScore < 55) stress += 1;
  if (debtRatio > 40) stress += 1;
  if (financialStability < 55) stress += 1;

  // Motivation weight — social/family push the decision toward review/postpone;
  // necessity/investment/offer soften it (offer only slightly).
  // Neutral (unclassified free-text) is treated as mildly cautious.
  let motivationWeight = 0;
  if (effectiveMotivation === "social") motivationWeight = 2;
  else if (effectiveMotivation === "desire") motivationWeight = 1;
  else if (effectiveMotivation === "family") motivationWeight = 1;
  else if (effectiveMotivation === "offer") motivationWeight = 0;
  else if (effectiveMotivation === "investment") motivationWeight = -1;
  else if (effectiveMotivation === "necessity") motivationWeight = -1;
  else if (effectiveMotivation === "neutral") motivationWeight = 0;

  const capacityStrain = yearsNeeded > 8 ? 2 : yearsNeeded > 4 ? 1 : 0;

  // Priority weight — a low-priority large goal is a bigger red flag.
  const priorityWeight = priority === "low" && size === "large" ? 1 : 0;
  // Size weight — large goals are scored slightly stricter overall.
  const sizeWeight = size === "large" ? 1 : 0;

  const score =
    stress + capacityStrain + motivationWeight + priorityWeight + sizeWeight;

  let verdict: Verdict;
  if (score <= 0) verdict = "achievable";
  else if (score <= 2) verdict = "review";
  else verdict = "postpone";

  // Human-facing label for the motivation — the predefined label when we
  // recognized it, or the user's own words when they picked "أخرى".
  const trimmedCustom = (customReason ?? "").trim();
  const motivationLabel =
    motivation === "other" && trimmedCustom.length > 0
      ? trimmedCustom
      : MOTIVATIONS.find((m) => m.key === motivation)?.label ?? "";

  // Narrative — driven by the effective (classified) motivation.
  let headline: string;
  let body: string;
  if (verdict === "achievable") {
    headline = "قرار مالي مناسب";
    body =
      "بناءً على قدرتك المالية الحالية والتزاماتك، يبدو هذا الشراء ممكناً مالياً ولا يُتوقع أن يؤثر على أهدافك طويلة الأمد.";
  } else if (verdict === "review") {
    if (
      effectiveMotivation === "social" ||
      effectiveMotivation === "desire"
    ) {
      headline = "قابل للتنفيذ مع مراجعة";
      body =
        `لأن هذا القرار متأثر بعوامل شخصية أو اجتماعية (${motivationLabel}) وقدرتك المالية الحالية محدودة نسبياً، يمكن تنفيذه مع ضبط الالتزامات الشهرية أو تعديل الأولوية.`;
    } else {
      headline = "قابل للتنفيذ مع تعديل بسيط";
      body =
        "الشراء ممكن، لكنه سيضغط على قدرتك الشهرية على الادخار. تعديل بسيط في الالتزامات أو تمديد مدة الهدف سيجعله أكثر أماناً على المدى الطويل.";
    }
  } else {
    if (size === "large" && readinessScore < 55) {
      headline = "تحذير — يُنصح بالتأجيل";
      body =
        effectiveMotivation === "social" || effectiveMotivation === "family"
          ? `التزام بهذا الحجم مدفوع بعوامل اجتماعية (${motivationLabel}) مع جاهزية مالية محدودة قد يُضعف استقرارك لسنوات. تحسين المؤشرات الأساسية أولاً يحمي أهدافك الأخرى.`
          : "التزام مالي بهذا الحجم في وضعك الحالي قد يقيّد مرونتك المالية ويؤخر أهدافك الأخرى لفترة طويلة. يُنصح بتحسين الجاهزية أو تقليل التكلفة قبل المضي.";
    } else if (
      effectiveMotivation === "social" ||
      effectiveMotivation === "family"
    ) {
      headline = "يُنصح بالتأجيل";
      body =
        `لأن هذا القرار مدفوع بعوامل اجتماعية (${motivationLabel}) بينما قدرتك الحالية على الادخار محدودة، تأجيل هذا الشراء قد يحسّن استقرارك المالي ويحمي أهدافك الأخرى.`;
    } else {
      headline = "يُنصح بالتأجيل";
      body =
        "الشراء في وضعك المالي الحالي قد يقلّل من مرونتك ويؤثر على أهدافك القادمة. تحسين الجاهزية أو الادخار لفترة قصيرة سيرفع فرص نجاح هذا القرار.";
    }
  }

  // Short reasons
  const reasons: string[] = [];
  if (monthlyCapacity <= 0) {
    reasons.push("قدرتك الشهرية على الادخار غير كافية حالياً.");
  } else if (yearsNeeded > 8) {
    reasons.push(
      `المبلغ المستهدف يحتاج أكثر من 8 سنوات ضمن قدرتك الحالية على الادخار.`
    );
  } else if (yearsNeeded > 4) {
    reasons.push(
      `المبلغ المستهدف يحتاج نحو ${Math.ceil(yearsNeeded)} سنوات ضمن قدرتك الحالية.`
    );
  } else {
    reasons.push(
      `المبلغ المستهدف يقع ضمن قدرتك الحالية خلال ${Math.max(1, Math.ceil(yearsNeeded))} سنوات.`
    );
  }

  if (debtRatio > 40) {
    reasons.push("نسبة الالتزامات الحالية مرتفعة وتحدّ من هامش السداد.");
  } else {
    reasons.push("نسبة الالتزامات ضمن الحدود الآمنة.");
  }

  if (financialStability < 55) {
    reasons.push("عدم ثبات الدخل يزيد من مخاطر هذا الالتزام.");
  }

  if (
    effectiveMotivation === "social" ||
    effectiveMotivation === "family"
  ) {
    reasons.push(
      `الدافع (${motivationLabel}) قد يؤثر على موضوعية القرار — يُفضّل مراجعته بروية.`
    );
  } else if (effectiveMotivation === "investment") {
    reasons.push(
      "طبيعة القرار الاستثماري يمكن أن تعوّض جزءاً من التكلفة على المدى البعيد."
    );
  } else if (effectiveMotivation === "necessity") {
    reasons.push("الدافع الأساسي (حاجة) يبرّر الأولوية رغم الضغط المالي.");
  } else if (effectiveMotivation === "neutral" && motivation === "other") {
    reasons.push(
      `تم توليد التحليل بناءً على شرحك (${motivationLabel}) وحالتك المالية الحالية.`
    );
  }

  if (size === "large" && priority === "low") {
    reasons.push(
      "التزام كبير بأولوية منخفضة — يُنصح بإعادة تقييم موقعه في خطتك."
    );
  }

  // Readiness tier — determines how the psychological insight closes.
  const readinessTier: ReadinessTier =
    readinessScore >= 75 ? "high" : readinessScore >= 55 ? "mid" : "low";
  const motivationInsight = buildMotivationInsight(
    effectiveMotivation,
    readinessTier,
    size,
    customReason
  );

  return {
    verdict,
    headline,
    body,
    reasons: reasons.slice(0, 4),
    motivationInsight,
  };
}

export function AIDecisionDialog({ open, input, onCancel, onConfirm }: Props) {
  const { result } = useAnalysis();
  const [step, setStep] = useState<"question" | "recommendation">("question");
  const [motivation, setMotivation] = useState<PurchaseMotivation | null>(null);
  const [customReason, setCustomReason] = useState<string>("");

  // Reset state whenever the dialog is opened for a new draft.
  const draftId = input?.draft?.name ?? null;
  useMemo(() => {
    if (open) {
      setStep("question");
      setMotivation(null);
      setCustomReason("");
    }
  }, [open, draftId]);

  const decision: AIDecision | null = useMemo(() => {
    if (!input || !motivation) return null;
    return buildAIDecision({
      targetPrice: input.draft.targetPrice,
      monthlyCapacity: Math.max(0, result?.monthlySavings ?? 0),
      readinessScore: result?.readinessScore ?? 0,
      debtRatio: result?.debtRatio ?? 100,
      financialStability: result?.financialStability ?? 0,
      motivation,
      priority: input.draft.priority,
      customReason: motivation === "other" ? customReason : undefined,
    });
  }, [input, motivation, customReason, result]);

  if (!open || !input) return null;

  const verdictStyle =
    decision?.verdict === "achievable"
      ? { bg: "#E4F1EC", color: "#0A5A42", icon: <CheckCircle2 className="h-4 w-4" /> }
      : decision?.verdict === "review"
      ? {
          bg: "rgba(131,127,216,0.16)",
          color: BANK.ai,
          icon: <Sparkles className="h-4 w-4" />,
        }
      : {
          bg: "#FBEDE5",
          color: "#8A4A2F",
          icon: <AlertTriangle className="h-4 w-4" />,
        };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="تحليل قرار الشراء"
      size="md"
    >
      {step === "question" && (
        <div>
          {/* AI intro */}
          <div className="mb-5 flex items-start gap-3">
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${BANK.ai}18`, color: BANK.ai }}
              aria-hidden="true"
            >
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: BANK.ai }}
              >
                مساعد القرار المالي
              </p>
              <h3
                className="mt-1 text-base font-bold sm:text-lg"
                style={{ color: BANK.ink }}
              >
                ما السبب الأساسي وراء هذا الشراء؟
              </h3>
              <p className="mt-1 text-xs" style={{ color: BANK.muted }}>
                يساعدنا فهم دافعك على تقديم توصية أدق قبل تأكيد الهدف.
              </p>
            </div>
          </div>

          {/* Motivation options */}
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MOTIVATIONS.map((m) => {
              const active = motivation === m.key;
              return (
                <li key={m.key}>
                  <button
                    type="button"
                    onClick={() => setMotivation(m.key)}
                    className="w-full rounded-xl px-4 py-3 text-right transition"
                    style={{
                      backgroundColor: active
                        ? `${BANK.ai}12`
                        : "#FFFFFF",
                      border: `1px solid ${active ? BANK.ai : BANK.paperEdge}`,
                      color: BANK.ink,
                    }}
                  >
                    <p
                      className="text-sm font-bold"
                      style={{ color: active ? BANK.ai : BANK.ink }}
                    >
                      {m.label}
                    </p>
                    <p
                      className="mt-0.5 text-[11px]"
                      style={{ color: BANK.muted }}
                    >
                      {m.hint}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Optional free-text reason — revealed only when "أخرى" is selected. */}
          <AnimatePresence initial={false}>
            {motivation === "other" && (
              <motion.div
                key="other-reason"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  <label className="block">
                    <span
                      className="mb-1.5 block text-xs font-semibold"
                      style={{ color: BANK.muted }}
                    >
                      اشرح السبب باختصار
                    </span>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      rows={3}
                      placeholder={
                        "مثال:\n- لأنه أعجبني.\n- هدية لشخص عزيز.\n- أحتاجه للدراسة.\n- أريد تطوير عملي.\n- سبب آخر..."
                      }
                      className="w-full resize-none rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      style={{
                        backgroundColor: "#FFFFFF",
                        border: `1px solid ${BANK.paperEdge}`,
                        color: BANK.ink,
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = BANK.ai;
                        e.currentTarget.style.boxShadow =
                          "0 0 0 4px rgba(131,127,216,0.15)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = BANK.paperEdge;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <p
                      className="mt-1 text-[10px]"
                      style={{ color: BANK.muted }}
                    >
                      حقل اختياري — الوصف الأكثر تحديداً يمنح تحليلاً أدق.
                    </p>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4"
               style={{ borderColor: BANK.paperEdge }}>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2 text-xs font-semibold transition hover:bg-black/5"
              style={{
                border: `1px solid ${BANK.paperEdge}`,
                color: BANK.ink,
                backgroundColor: "#FFFFFF",
              }}
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={!motivation}
              onClick={() => setStep("recommendation")}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: BANK.ai }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              تحليل القرار
            </button>
          </div>
        </div>
      )}

      {step === "recommendation" && decision && motivation && (
        <div>
          {/* Verdict header */}
          <div className="mb-5 flex items-start gap-3">
            <span
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: verdictStyle.bg, color: verdictStyle.color }}
              aria-hidden="true"
            >
              {verdictStyle.icon}
            </span>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: verdictStyle.color }}
              >
                توصية الذكاء الاصطناعي
              </p>
              <h3
                className="mt-1 text-base font-bold sm:text-lg"
                style={{ color: BANK.ink }}
              >
                {decision.headline}
              </h3>
            </div>
          </div>

          {/* Narrative body */}
          <p
            className="text-sm leading-loose"
            style={{ color: BANK.muted }}
          >
            {decision.body}
          </p>

          {/* Psychological Motivation Analysis — per-motivation */}
          <div
            className="mt-4 rounded-2xl p-4"
            style={{
              backgroundColor: `${BANK.ai}0F`,
              border: `1px solid ${BANK.ai}33`,
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${BANK.ai}22`, color: BANK.ai }}
                aria-hidden="true"
              >
                <Brain className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: BANK.ai }}
                >
                  تحليل نفسي للدافع
                </p>
                <h4
                  className="mt-1 text-sm font-bold sm:text-base"
                  style={{ color: BANK.ink }}
                >
                  {decision.motivationInsight.title}
                </h4>
                <p
                  className="mt-2 text-[13px] leading-relaxed"
                  style={{ color: BANK.muted }}
                >
                  {decision.motivationInsight.body}
                </p>
                <p
                  className="mt-2 text-[12px] font-semibold leading-relaxed"
                  style={{ color: BANK.inkAlt }}
                >
                  {decision.motivationInsight.readinessContext}
                </p>
              </div>
            </div>
          </div>

          {/* Signals summary */}
          <div
            className="mt-4 grid gap-2 rounded-2xl p-3 sm:grid-cols-3"
            style={{
              backgroundColor: BANK.paper,
              border: `1px solid ${BANK.paperEdge}`,
            }}
          >
            <MiniSignal
              label="المبلغ المستهدف"
              value={formatSAR(input.draft.targetPrice)}
            />
            <MiniSignal
              label="القدرة الشهرية"
              value={formatSAR(Math.max(0, result?.monthlySavings ?? 0))}
            />
            <MiniSignal
              label="الدافع"
              value={
                motivation === "other"
                  ? customReason.trim() || "أخرى"
                  : MOTIVATIONS.find((m) => m.key === motivation)?.label ?? "—"
              }
            />
          </div>

          {/* Reasons */}
          <ul className="mt-4 space-y-2">
            {decision.reasons.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[11px] leading-relaxed"
                style={{ color: BANK.muted }}
              >
                <span
                  className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: BANK.inkAlt }}
                >
                  {i + 1}
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div
            className="mt-6 flex flex-wrap justify-between gap-2 border-t pt-4"
            style={{ borderColor: BANK.paperEdge }}
          >
            <button
              type="button"
              onClick={() => setStep("question")}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition hover:bg-black/5"
              style={{ color: BANK.muted }}
            >
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
              تعديل الدافع
            </button>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl px-4 py-2 text-xs font-semibold transition hover:bg-black/5"
                style={{
                  border: `1px solid ${BANK.paperEdge}`,
                  color: BANK.ink,
                  backgroundColor: "#FFFFFF",
                }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => onConfirm(motivation)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                style={{ backgroundColor: BANK.accent }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {decision.verdict === "postpone"
                  ? "تأكيد الإضافة رغم التحذير"
                  : "تأكيد الإضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function MiniSignal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-[9px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: BANK.muted }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 text-xs font-bold tabular-nums"
        style={{ color: BANK.ink }}
      >
        {value}
      </p>
    </div>
  );
}


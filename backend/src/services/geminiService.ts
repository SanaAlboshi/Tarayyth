import { GoogleGenAI } from "@google/genai";
import {
  AnalyzeRequestBody,
  FinancialMetrics,
  GeminiAnalysis,
} from "../types";

const MODEL_NAME = "gemini-2.5-flash";

let genAiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY غير موجود. الرجاء إضافته في ملف backend/.env"
      );
    }
    genAiClient = new GoogleGenAI({ apiKey });
  }
  return genAiClient;
}

function buildPrompt(
  input: AnalyzeRequestBody,
  metrics: FinancialMetrics
): string {
  return `أنت محلل مالي شخصي خبير. لديك بيانات المستخدم والمؤشرات المالية التي تم حسابها مسبقاً (لا تقم بأي عمليات حسابية بنفسك، فقط قم بتحليل الأرقام المُعطاة).

بيانات المستخدم:
- الراتب الشهري: ${input.monthlySalary}
- المصاريف الشهرية: ${input.monthlyExpenses}
- الديون الشهرية: ${input.monthlyDebts}
- إنفاق المطاعم: ${input.restaurantSpending}
- إنفاق الترفيه: ${input.entertainmentSpending}
- الهدف المالي: ${input.financialGoal}
- سعر الهدف: ${input.goalPrice}
- عدد الأشهر المطلوبة لتحقيق الهدف: ${input.desiredMonths}

المؤشرات المالية المحسوبة مسبقاً (اعتمد عليها فقط، ولا تُعد حسابها):
- الادخار الشهري (Saving): ${metrics.saving}
- نسبة الادخار (Saving Rate): ${metrics.savingRate}%
- التسرب المالي (Financial Leakage): ${metrics.financialLeakage}%
- درجة الجاهزية المالية (Financial Readiness Score): ${metrics.financialReadinessScore} من 100

المطلوب:
قم بتحليل هذه البيانات وأعد النتيجة **بصيغة JSON فقط**، بدون أي نص إضافي قبله أو بعده، وبدون Markdown code fences، وبهذا الشكل بالضبط:

{
  "behaviorAnalysis": "نص تحليلي باللغة العربية عن السلوك المالي للمستخدم",
  "recommendations": ["توصية أولى", "توصية ثانية", "توصية ثالثة"],
  "decision": "Proceed أو Delay أو Reconsider بخصوص تحقيق الهدف المالي",
  "riskLevel": "Low أو Medium أو High"
}

ملاحظات مهمة:
- "behaviorAnalysis" يجب أن يكون باللغة العربية.
- عناصر "recommendations" يجب أن تكون باللغة العربية.
- "decision" يجب أن تكون بالضبط واحدة من: "Proceed", "Delay", "Reconsider".
- "riskLevel" يجب أن تكون بالضبط واحدة من: "Low", "Medium", "High".
- لا تقم بأي حسابات رقمية جديدة، استخدم فقط المؤشرات المُعطاة أعلاه في تحليلك.`;
}

function extractJsonText(rawText: string): string {
  const trimmed = rawText.trim();
  // في حال أعاد النموذج JSON ملفوفاً بـ code fences رغم التعليمات
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

function isValidDecision(value: unknown): value is GeminiAnalysis["decision"] {
  return value === "Proceed" || value === "Delay" || value === "Reconsider";
}

function isValidRiskLevel(
  value: unknown
): value is GeminiAnalysis["riskLevel"] {
  return value === "Low" || value === "Medium" || value === "High";
}

export async function getFinancialAnalysis(
  input: AnalyzeRequestBody,
  metrics: FinancialMetrics
): Promise<GeminiAnalysis> {
  const client = getClient();
  const prompt = buildPrompt(input, metrics);

  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  const rawText = response.text ?? "";
  const jsonText = extractJsonText(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    throw new Error(
      `فشل تحليل استجابة Gemini كـ JSON. الاستجابة الخام: ${rawText}`
    );
  }

  const candidate = parsed as Partial<GeminiAnalysis>;

  if (
    typeof candidate.behaviorAnalysis !== "string" ||
    !Array.isArray(candidate.recommendations) ||
    !candidate.recommendations.every((r) => typeof r === "string") ||
    !isValidDecision(candidate.decision) ||
    !isValidRiskLevel(candidate.riskLevel)
  ) {
    throw new Error(
      "استجابة Gemini لا تطابق الشكل المطلوب (behaviorAnalysis, recommendations, decision, riskLevel)."
    );
  }

  return {
    behaviorAnalysis: candidate.behaviorAnalysis,
    recommendations: candidate.recommendations,
    decision: candidate.decision,
    riskLevel: candidate.riskLevel,
  };
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendForRequest = recommendForRequest;
const gemini_1 = require("./gemini");
async function recommendForRequest(params) {
    const { analysis, requestedAmount, applicantName, requestType } = params;
    const fallback = {
        decision: analysis.readinessScore >= 70
            ? "موافقة"
            : analysis.readinessScore >= 50
                ? "مراجعة يدوية"
                : "رفض",
        confidence: Math.max(55, Math.min(95, analysis.readinessScore)),
        reasoning: [
            `درجة الجاهزية المالية للعميل ${analysis.readinessScore}٪`,
            `مستوى الخطر: ${analysis.riskLevel}`,
            `نسبة الالتزامات: ${analysis.debtRatio}٪`,
        ],
        conditions: [
            "تقديم كشف حساب لآخر 6 أشهر",
            "توفير خطاب تعريف موقّع من جهة العمل",
        ],
        riskFactors: analysis.weaknesses.slice(0, 3),
        suggestedAmount: Math.round(requestedAmount * 0.9),
        suggestedTermMonths: 36,
        aiSummary: `التقييم الأولي لطلب ${applicantName} من نوع ${requestType} يعتمد على درجة الجاهزية المالية ونسبة الالتزامات الحالية.`,
    };
    try {
        const prompt = `أنت محلل ائتماني في بنك يستخدم منصة Trayyath. قدّم توصية عن طلب تمويل.
اسم مقدم الطلب: ${applicantName}
نوع التمويل: ${requestType}
المبلغ المطلوب: ${requestedAmount} ريال
الجاهزية المالية: ${analysis.readinessScore}٪
نسبة الالتزامات: ${analysis.debtRatio}٪
الاستقرار المالي: ${analysis.financialStability}٪
كفاءة الميزانية: ${analysis.budgetEfficiency}٪
صندوق الطوارئ: ${analysis.emergencyFund}٪
مستوى الخطر: ${analysis.riskLevel}

أعد JSON فقط بالمفاتيح التالية:
{
  "decision": "موافقة" أو "رفض" أو "مراجعة يدوية",
  "confidence": (0-100),
  "reasoning": ["مبرر 1", "مبرر 2", "مبرر 3"],
  "conditions": ["شرط 1", "شرط 2"],
  "riskFactors": ["عامل خطر 1", "عامل خطر 2"],
  "suggestedAmount": رقم,
  "suggestedTermMonths": رقم,
  "aiSummary": "ملخص احترافي"
}`;
        const ai = await (0, gemini_1.generateJson)(prompt);
        return { ...fallback, ...ai };
    }
    catch (err) {
        console.warn("Bank recommendation AI failed", err);
        return fallback;
    }
}

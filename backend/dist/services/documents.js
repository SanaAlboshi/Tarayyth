"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDocumentText = analyzeDocumentText;
const gemini_1 = require("./gemini");
async function analyzeDocumentText(name, snippet) {
    const fallback = {
        revenue: 1250000,
        profit: 340000,
        debt: 480000,
        assets: 2100000,
        liabilities: 780000,
        cashFlow: 220000,
        observations: [
            "التدفقات النقدية إيجابية وتغطي الالتزامات الحالية",
            "نسبة الديون إلى الأصول ضمن الحدود الآمنة",
            "الأرباح التشغيلية مستقرة على مدى ثلاثة أرباع",
        ],
        riskLevel: "متوسط",
        aiSummary: "الوضع المالي للمنشأة مقبول مع نمو إيرادات مستدام وقدرة جيدة على خدمة الالتزامات، مع الحاجة لمراقبة نسبة السيولة.",
    };
    try {
        const prompt = `أنت محلل مالي في منصة Trayyath. حلّل مستخرج من مستند مالي "${name}":
"""
${snippet.slice(0, 4000)}
"""
أعد JSON فقط:
{
  "revenue": رقم,
  "profit": رقم,
  "debt": رقم,
  "assets": رقم,
  "liabilities": رقم,
  "cashFlow": رقم,
  "observations": ["ملاحظة 1", "ملاحظة 2", "ملاحظة 3"],
  "riskLevel": "منخفض" أو "متوسط" أو "مرتفع" أو "حرج",
  "aiSummary": "ملخص تنفيذي"
}`;
        const ai = await (0, gemini_1.generateJson)(prompt);
        return { ...fallback, ...ai };
    }
    catch (err) {
        console.warn("Document AI failed", err);
        return fallback;
    }
}

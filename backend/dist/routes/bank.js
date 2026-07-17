"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bankRecommendation_1 = require("../services/bankRecommendation");
const gemini_1 = require("../services/gemini");
const router = (0, express_1.Router)();
router.post("/bank/recommendation", async (req, res, next) => {
    try {
        const { applicantName, requestedAmount, requestType, analysis } = req.body;
        if (!analysis) {
            res.status(400).json({ error: "التقرير المالي مطلوب لإصدار التوصية." });
            return;
        }
        const rec = await (0, bankRecommendation_1.recommendForRequest)({
            applicantName: applicantName || "عميل",
            requestType: requestType || "تمويل شخصي",
            requestedAmount: Number(requestedAmount) || 100000,
            analysis,
        });
        res.json(rec);
    }
    catch (err) {
        next(err);
    }
});
router.post("/bank/portfolio-insights", async (req, res, next) => {
    try {
        const { sectors, highRiskCount, avgRisk } = req.body;
        const fallback = {
            insights: [
                "قطاع الإنشاءات يشهد ارتفاعاً في المخاطر خلال آخر ربع سنوي.",
                "قطاع التجزئة يقترب من عتبة عدم الاستقرار.",
                "قطاع التقنية يحافظ على أداء صحي ونمو مستدام.",
                "التركز الائتماني في قطاع واحد أعلى من الحد التوصوي.",
                "العملاء ذوو الخطر المرتفع بحاجة إلى مراجعة عاجلة.",
                "التنويع في المحفظة يوصى به على المدى القريب.",
            ],
            recommendations: [
                "تقليل التعرض للقطاعات مرتفعة الخطر.",
                "مراجعة الطلبات مرتفعة الخطر أولاً.",
                "توزيع التمويل على قطاعات متعددة.",
                "متابعة العملاء غير المستقرين شهرياً.",
                "زيادة عمق مراجعة الطلبات ذات القيمة العالية.",
            ],
        };
        try {
            const prompt = `أنت محلل مخاطر محفظة مصرفية في منصة Trayyath.
عدد العملاء مرتفعي الخطر: ${highRiskCount ?? 0}
متوسط الخطر: ${avgRisk ?? 0}
القطاعات: ${JSON.stringify(sectors ?? [])}
أعد JSON فقط:
{
  "insights": ["6 رؤى تحليلية عن المحفظة"],
  "recommendations": ["5 توصيات ذكية"]
}`;
            const ai = await (0, gemini_1.generateJson)(prompt);
            res.json({ ...fallback, ...ai });
            return;
        }
        catch (err) {
            console.warn("Portfolio insights AI failed", err);
            res.json(fallback);
        }
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

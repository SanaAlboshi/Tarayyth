"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAnalysis = runAnalysis;
const gemini_1 = require("./gemini");
function heuristicAnalysis(input) {
    const disposable = Math.max(0, input.salary - input.expenses);
    const debtRatio = input.salary > 0 ? Math.min(100, (input.debts / input.salary) * 100) : 0;
    const expenseRatio = input.salary > 0 ? Math.min(100, (input.expenses / input.salary) * 100) : 0;
    const monthlySavings = Math.max(0, disposable);
    const emergencyFundMonths = input.expenses > 0 ? input.savings / input.expenses : 12;
    const leakage = input.restaurants + input.entertainment;
    const leakageRatio = input.salary > 0 ? (leakage / input.salary) * 100 : 0;
    let readiness = 100;
    readiness -= Math.min(35, debtRatio * 0.6);
    readiness -= Math.min(25, Math.max(0, expenseRatio - 60) * 0.5);
    readiness -= Math.min(15, leakageRatio * 0.6);
    if (emergencyFundMonths < 3)
        readiness -= 12;
    readiness = Math.max(15, Math.min(98, Math.round(readiness)));
    const stability = Math.max(20, Math.min(98, 90 - debtRatio * 0.4 - Math.max(0, expenseRatio - 55) * 0.4));
    const budgetEfficiency = Math.max(20, Math.min(98, 95 - expenseRatio * 0.5 - leakageRatio * 0.5));
    const emergencyFundScore = Math.max(10, Math.min(100, emergencyFundMonths * 20));
    const monthsToGoal = monthlySavings > 0 ? input.goalPrice / monthlySavings : 999;
    const goalProbability = Math.max(5, Math.min(97, Math.round(100 - Math.max(0, monthsToGoal - input.targetMonths) * 4)));
    const risk = readiness >= 75 ? "منخفض" : readiness >= 55 ? "متوسط" : readiness >= 35 ? "مرتفع" : "حرج";
    return {
        readinessScore: readiness,
        debtRatio: Math.round(debtRatio),
        expenseRatio: Math.round(expenseRatio),
        budgetEfficiency: Math.round(budgetEfficiency),
        financialStability: Math.round(stability),
        emergencyFund: Math.round(emergencyFundScore),
        goalAchievementProbability: goalProbability,
        monthlySavings: Math.round(monthlySavings),
        disposableIncome: Math.round(disposable),
        financialLeakage: Math.round(leakage),
        riskLevel: risk,
        executiveSummary: "بناءً على بياناتك، مستوى الجاهزية المالي في حدود مقبولة مع وجود فرص واضحة لتحسين كفاءة الإنفاق ورفع نسبة الادخار الشهري وبناء صندوق طوارئ متين.",
        strengths: [
            "دخل شهري ثابت يوفر أساساً مالياً مستقراً",
            "وجود مدخرات تقلل الحاجة للاقتراض الطارئ",
            "قدرة على تخصيص جزء شهري للهدف المالي",
        ],
        weaknesses: [
            "نسبة التسريب المالي في الترفيه والمطاعم مرتفعة نسبياً",
            "غياب صندوق طوارئ يغطي 6 أشهر",
            "نسبة الالتزامات تؤثر على مرونة الميزانية",
        ],
        recommendations: [
            "خفض مصاريف المطاعم بنسبة 25٪ لرفع الادخار الشهري",
            "بناء صندوق طوارئ يعادل 6 أشهر من المصاريف",
            "توجيه فائض الدخل نحو الهدف المالي بشكل تلقائي",
            "مراجعة الاشتراكات الدورية وإلغاء غير المستخدم منها",
        ],
        monthlyPlan: [
            "تخصيص 50٪ للاحتياجات الأساسية",
            "تخصيص 20٪ للادخار وسداد الديون",
            "تخصيص 20٪ لهدف الشراء المستقبلي",
            "تخصيص 10٪ للترفيه والاستمتاع",
        ],
        warnings: [
            "احرص على عدم زيادة نسبة الديون فوق 30٪ من الدخل",
            "تجنّب الاقتراض لتغطية النفقات الترفيهية",
        ],
        finalAdvice: "التزم بخطة الإنفاق المقترحة لمدة 3 أشهر ثم أعد تقييم وضعك. ستلاحظ تحسناً ملموساً في الجاهزية المالية وتقلص المخاطر بشكل واضح.",
    };
}
async function runAnalysis(input) {
    const fallback = heuristicAnalysis(input);
    try {
        const prompt = `أنت مستشار مالي محترف يعمل لدى منصة Trayyath المصرفية. حلّل بيانات العميل التالية بالريال السعودي:
- الراتب الشهري: ${input.salary}
- المصاريف الشهرية: ${input.expenses}
- الديون الحالية: ${input.debts}
- المدخرات: ${input.savings}
- مصاريف المطاعم: ${input.restaurants}
- مصاريف الترفيه: ${input.entertainment}
- الهدف المالي: ${input.goal}
- تكلفة الهدف: ${input.goalPrice}
- الأشهر المستهدفة: ${input.targetMonths}

أعِد JSON فقط بالمفاتيح التالية بالعربية الفصحى. جميع القيم الرقمية بدون فواصل ألف:
{
  "readinessScore": (0-100),
  "debtRatio": (0-100),
  "expenseRatio": (0-100),
  "budgetEfficiency": (0-100),
  "financialStability": (0-100),
  "emergencyFund": (0-100),
  "goalAchievementProbability": (0-100),
  "monthlySavings": رقم,
  "disposableIncome": رقم,
  "financialLeakage": رقم,
  "riskLevel": "منخفض" أو "متوسط" أو "مرتفع" أو "حرج",
  "executiveSummary": "ملخص تنفيذي احترافي (3 أسطر)",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2", "نقطة ضعف 3"],
  "recommendations": ["توصية 1", "توصية 2", "توصية 3", "توصية 4"],
  "monthlyPlan": ["بند 1", "بند 2", "بند 3", "بند 4"],
  "warnings": ["تحذير 1", "تحذير 2"],
  "finalAdvice": "نصيحة نهائية شاملة"
}`;
        const ai = await (0, gemini_1.generateJson)(prompt);
        return {
            ...fallback,
            ...ai,
            readinessScore: clamp(ai.readinessScore, 0, 100, fallback.readinessScore),
            debtRatio: clamp(ai.debtRatio, 0, 100, fallback.debtRatio),
            expenseRatio: clamp(ai.expenseRatio, 0, 100, fallback.expenseRatio),
            budgetEfficiency: clamp(ai.budgetEfficiency, 0, 100, fallback.budgetEfficiency),
            financialStability: clamp(ai.financialStability, 0, 100, fallback.financialStability),
            emergencyFund: clamp(ai.emergencyFund, 0, 100, fallback.emergencyFund),
            goalAchievementProbability: clamp(ai.goalAchievementProbability, 0, 100, fallback.goalAchievementProbability),
        };
    }
    catch (err) {
        console.warn("Gemini analysis failed, using heuristic:", err);
        return fallback;
    }
}
function clamp(v, min, max, fallback) {
    if (typeof v !== "number" || Number.isNaN(v))
        return fallback;
    return Math.max(min, Math.min(max, Math.round(v)));
}

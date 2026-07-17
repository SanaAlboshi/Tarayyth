"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScenario = runScenario;
const gemini_1 = require("./gemini");
const analysis_1 = require("./analysis");
const SCENARIO_META = {
    salary_drop_20: {
        title: "انخفاض الراتب 20٪",
        description: "محاكاة تقليص مفاجئ في الدخل الشهري بنسبة 20٪.",
    },
    unexpected_expense: {
        title: "مصروف غير متوقع",
        description: "مصروف طارئ يعادل راتباً كاملاً (سيارة، طبي، إصلاحات).",
    },
    new_loan: {
        title: "الحصول على قرض جديد",
        description: "التزام جديد بقيمة قسط شهري 15٪ من الدخل.",
    },
    marriage: {
        title: "تكاليف الزواج",
        description: "زيادة المصاريف الثابتة بمقدار 30٪ لتغطية تكاليف بناء أسرة.",
    },
    baby: {
        title: "قدوم مولود",
        description: "زيادة المصاريف الشهرية بمقدار 2500 ريال لرعاية الطفل.",
    },
    inflation: {
        title: "موجة تضخم",
        description: "ارتفاع الأسعار العام بنسبة 12٪ يزيد المصاريف اليومية.",
    },
    job_loss: {
        title: "فقدان الوظيفة",
        description: "انقطاع الدخل لمدة 3 أشهر مع الاعتماد الكلي على المدخرات.",
    },
};
function applyScenario(input, key) {
    const modified = { ...input };
    switch (key) {
        case "salary_drop_20":
            modified.salary = Math.round(input.salary * 0.8);
            break;
        case "unexpected_expense":
            modified.savings = Math.max(0, input.savings - input.salary);
            modified.expenses = input.expenses + Math.round(input.salary * 0.15);
            break;
        case "new_loan":
            modified.debts = input.debts + Math.round(input.salary * 0.15);
            modified.expenses = input.expenses + Math.round(input.salary * 0.15);
            break;
        case "marriage":
            modified.expenses = Math.round(input.expenses * 1.3);
            modified.savings = Math.max(0, input.savings - Math.round(input.salary * 2));
            break;
        case "baby":
            modified.expenses = input.expenses + 2500;
            break;
        case "inflation":
            modified.expenses = Math.round(input.expenses * 1.12);
            modified.restaurants = Math.round(input.restaurants * 1.12);
            break;
        case "job_loss":
            modified.salary = 0;
            modified.savings = Math.max(0, input.savings - input.expenses * 3);
            break;
    }
    return modified;
}
function timeline(oldScore, newScore) {
    const points = [];
    for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const value = Math.round(oldScore * (1 - t) + newScore * t);
        points.push({ month: i, score: value });
    }
    return points;
}
async function runScenario(req) {
    const meta = SCENARIO_META[req.scenario];
    const modifiedInput = applyScenario(req.input, req.scenario);
    const newAnalysis = await (0, analysis_1.runAnalysis)(modifiedInput);
    const scoreDelta = newAnalysis.readinessScore - req.baseline.readinessScore;
    const probability = Math.max(10, Math.min(95, 60 - scoreDelta));
    let aiExplanation = `التغيّر في الوضع المالي متوقع بسبب ${meta.title}. تأثير مباشر على الجاهزية والقدرة على مواجهة الالتزامات.`;
    let advice = "خصّص جزءاً إضافياً من الدخل للطوارئ وراجع المصاريف غير الأساسية.";
    try {
        const prompt = `أنت مستشار مالي في منصة Trayyath. سيناريو ضغط مالي: ${meta.title} — ${meta.description}.
الجاهزية قبل: ${req.baseline.readinessScore}٪ ومستوى الخطر: ${req.baseline.riskLevel}.
الجاهزية بعد: ${newAnalysis.readinessScore}٪ ومستوى الخطر: ${newAnalysis.riskLevel}.
أعد JSON فقط:
{"aiExplanation": "شرح احترافي (سطران)", "advice": "نصيحة عملية قابلة للتنفيذ"}`;
        const ai = await (0, gemini_1.generateJson)(prompt);
        if (ai.aiExplanation)
            aiExplanation = ai.aiExplanation;
        if (ai.advice)
            advice = ai.advice;
    }
    catch (err) {
        console.warn("Scenario AI narrative failed", err);
    }
    return {
        scenario: req.scenario,
        title: meta.title,
        description: meta.description,
        oldScore: req.baseline.readinessScore,
        newScore: newAnalysis.readinessScore,
        oldRisk: req.baseline.riskLevel,
        newRisk: newAnalysis.riskLevel,
        probability,
        advice,
        aiExplanation,
        impactTimeline: timeline(req.baseline.readinessScore, newAnalysis.readinessScore),
    };
}

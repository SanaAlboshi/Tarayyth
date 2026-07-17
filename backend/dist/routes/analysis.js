"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analysis_1 = require("../services/analysis");
const router = (0, express_1.Router)();
router.post("/analysis", async (req, res, next) => {
    try {
        const body = req.body;
        const input = {
            salary: Number(body.salary) || 0,
            expenses: Number(body.expenses) || 0,
            debts: Number(body.debts) || 0,
            savings: Number(body.savings) || 0,
            restaurants: Number(body.restaurants) || 0,
            entertainment: Number(body.entertainment) || 0,
            goal: String(body.goal ?? ""),
            goalPrice: Number(body.goalPrice) || 0,
            targetMonths: Number(body.targetMonths) || 12,
        };
        if (input.salary <= 0) {
            res.status(400).json({ error: "الراتب مطلوب ويجب أن يكون رقماً موجباً." });
            return;
        }
        const result = await (0, analysis_1.runAnalysis)(input);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

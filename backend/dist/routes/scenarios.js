"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scenarios_1 = require("../services/scenarios");
const router = (0, express_1.Router)();
router.post("/scenarios", async (req, res, next) => {
    try {
        const payload = req.body;
        if (!payload?.input || !payload?.baseline || !payload?.scenario) {
            res.status(400).json({ error: "بيانات السيناريو غير مكتملة." });
            return;
        }
        const outcome = await (0, scenarios_1.runScenario)(payload);
        res.json(outcome);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

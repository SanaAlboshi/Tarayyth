"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documents_1 = require("../services/documents");
const router = (0, express_1.Router)();
router.post("/documents", async (req, res, next) => {
    try {
        const { name, snippet } = req.body;
        const result = await (0, documents_1.analyzeDocumentText)(name || "مستند مالي", snippet || "بيانات مالية عامة تم استخراجها من مستند رسمي.");
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

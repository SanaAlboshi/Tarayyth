"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_1 = require("../services/chat");
const router = (0, express_1.Router)();
router.post("/chat", async (req, res, next) => {
    try {
        const { history, context } = req.body;
        const safe = Array.isArray(history) ? history : [];
        const reply = await (0, chat_1.chatReply)(safe, context);
        res.json({ reply });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error("خطأ في الخادم:", err);
    const message = err instanceof Error ? err.message : "خطأ غير متوقع في الخادم";
    res.status(500).json({ error: message });
}

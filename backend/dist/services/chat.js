"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatReply = chatReply;
const gemini_1 = require("./gemini");
async function chatReply(history, context) {
    const contextLine = context ? `\nسياق العميل: ${context}\n` : "";
    const dialog = history
        .slice(-8)
        .map((t) => `${t.role === "user" ? "المستخدم" : "المساعد"}: ${t.content}`)
        .join("\n");
    const prompt = `أنت "طَرِيّث" — مساعد مالي احترافي في منصة Trayyath المصرفية. أجب باللغة العربية الفصحى بأسلوب موجز ومباشر، بحد أقصى 4 أسطر.
${contextLine}
${dialog}
المساعد:`;
    try {
        const text = await (0, gemini_1.generateText)(prompt);
        return text.trim() || "أعتذر، لم أتمكن من فهم الطلب. هل يمكنك إعادة الصياغة؟";
    }
    catch (err) {
        console.warn("Chat AI failed", err);
        return "الخدمة الذكية غير متاحة حالياً. تفضّل بالمحاولة بعد قليل.";
    }
}

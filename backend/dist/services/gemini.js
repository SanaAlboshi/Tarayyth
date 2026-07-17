"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJson = generateJson;
exports.generateText = generateText;
const genai_1 = require("@google/genai");
const env_1 = require("../config/env");
let cached = null;
function getClient() {
    if (!cached) {
        if (!env_1.env.geminiApiKey) {
            throw new Error("مفتاح Gemini API غير مضبوط في متغيرات البيئة.");
        }
        cached = new genai_1.GoogleGenAI({ apiKey: env_1.env.geminiApiKey });
    }
    return cached;
}
async function generateJson(prompt) {
    const client = getClient();
    const response = await client.models.generateContent({
        model: env_1.env.geminiModel,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            temperature: 0.7,
        },
    });
    const text = response.text ?? "";
    if (!text)
        throw new Error("لم يتم استلام رد من محرك الذكاء الاصطناعي.");
    const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
    try {
        return JSON.parse(cleaned);
    }
    catch {
        const first = cleaned.indexOf("{");
        const last = cleaned.lastIndexOf("}");
        if (first >= 0 && last > first) {
            return JSON.parse(cleaned.slice(first, last + 1));
        }
        throw new Error("تعذّر تفسير الرد كـ JSON.");
    }
}
async function generateText(prompt) {
    const client = getClient();
    const response = await client.models.generateContent({
        model: env_1.env.geminiModel,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            temperature: 0.7,
        },
    });
    return response.text ?? "";
}

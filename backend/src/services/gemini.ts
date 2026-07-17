import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

let cached: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!cached) {
    if (!env.geminiApiKey) {
      throw new Error("مفتاح Gemini API غير مضبوط في متغيرات البيئة.");
    }
    cached = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return cached;
}

export async function generateJson<T = unknown>(prompt: string): Promise<T> {
  const client = getClient();
  const response = await client.models.generateContent({
    model: env.geminiModel,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const text = response.text ?? "";
  if (!text) throw new Error("لم يتم استلام رد من محرك الذكاء الاصطناعي.");

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1)) as T;
    }
    throw new Error("تعذّر تفسير الرد كـ JSON.");
  }
}

export async function generateText(prompt: string): Promise<string> {
  const client = getClient();
  const response = await client.models.generateContent({
    model: env.geminiModel,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.7,
    },
  });
  return response.text ?? "";
}

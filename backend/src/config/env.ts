import "dotenv/config";

export const env = {
  port: process.env.PORT ? Number(process.env.PORT) : 4001,
  geminiApiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

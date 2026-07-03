import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { AnalyzeRequestBody, AnalyzeResponseBody } from "./types";
import { calculateFinancialMetrics } from "./utils/calculations";
import { getFinancialAnalysis } from "./services/geminiService";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;

app.use(cors());
app.use(express.json());

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateBody(body: unknown): body is AnalyzeRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;

  return (
    isValidNumber(b.monthlySalary) &&
    isValidNumber(b.monthlyExpenses) &&
    isValidNumber(b.monthlyDebts) &&
    isValidNumber(b.restaurantSpending) &&
    isValidNumber(b.entertainmentSpending) &&
    typeof b.financialGoal === "string" &&
    b.financialGoal.trim().length > 0 &&
    isValidNumber(b.goalPrice) &&
    isValidNumber(b.desiredMonths)
  );
}

app.post(
  "/api/analyze",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!validateBody(req.body)) {
        res.status(400).json({
          error:
            "بيانات الطلب غير صحيحة. تأكد من إرسال جميع الحقول المطلوبة بالأنواع الصحيحة.",
        });
        return;
      }

      const input = req.body as AnalyzeRequestBody;

      // 1) الحسابات المالية تتم بالكامل هنا في الـ Backend
      const metrics = calculateFinancialMetrics(input);

      // 2) نرسل فقط النتائج الجاهزة إلى Gemini للتحليل النصي
      const analysis = await getFinancialAnalysis(input, metrics);

      const responseBody: AnalyzeResponseBody = { metrics, analysis };
      res.status(200).json(responseBody);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Error handler عام
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("خطأ في الخادم:", err);
  const message = err instanceof Error ? err.message : "خطأ غير متوقع في الخادم";
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`✅ Financial AI Analyzer backend يعمل على http://localhost:${PORT}`);
});

import { Router } from "express";
import { assessReadiness } from "../services/readiness";
import { AnalysisInput, AnalysisResult } from "../services/analysis";

const router = Router();

router.post("/readiness", async (req, res, next) => {
  try {
    const { input, analysis } = req.body as {
      input?: AnalysisInput;
      analysis?: AnalysisResult;
    };
    if (!input || !analysis) {
      res.status(400).json({ error: "بيانات فحص الجاهزية غير مكتملة." });
      return;
    }
    const result = await assessReadiness(input, analysis);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

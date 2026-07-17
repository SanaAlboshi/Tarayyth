import { Router } from "express";
import { buildSavingsPlan, SavingsPlanRequest } from "../services/savingsPlan";

const router = Router();

router.post("/savings-plan", async (req, res, next) => {
  try {
    const payload = req.body as SavingsPlanRequest;
    if (!payload?.input || !payload?.result) {
      res.status(400).json({ error: "بيانات خطة الادخار غير مكتملة." });
      return;
    }
    const result = await buildSavingsPlan({
      ...payload,
      history: Array.isArray(payload.history) ? payload.history : [],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

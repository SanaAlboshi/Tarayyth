import { Router } from "express";
import { coachInsights, CoachRequest } from "../services/coach";

const router = Router();

router.post("/coach", async (req, res, next) => {
  try {
    const payload = req.body as CoachRequest;
    if (!payload?.input || !payload?.result) {
      res.status(400).json({ error: "بيانات المدرّب المالي غير مكتملة." });
      return;
    }
    const result = await coachInsights({
      ...payload,
      history: Array.isArray(payload.history) ? payload.history : [],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

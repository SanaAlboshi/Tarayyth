import { Router } from "express";
import { runScenario, ScenarioRequest } from "../services/scenarios";

const router = Router();

router.post("/scenarios", async (req, res, next) => {
  try {
    const payload = req.body as ScenarioRequest;
    if (!payload?.input || !payload?.baseline || !payload?.scenario) {
      res.status(400).json({ error: "بيانات السيناريو غير مكتملة." });
      return;
    }
    const outcome = await runScenario(payload);
    res.json(outcome);
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from "express";
import { checkinFeedback, CheckinRequest } from "../services/checkin";

const router = Router();

router.post("/checkin", async (req, res, next) => {
  try {
    const payload = req.body as CheckinRequest;
    if (!payload || typeof payload.savedThisMonth !== "number") {
      res.status(400).json({ error: "بيانات التحديث الشهري غير مكتملة." });
      return;
    }
    const result = await checkinFeedback(payload);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

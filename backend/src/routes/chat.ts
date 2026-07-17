import { Router } from "express";
import { chatReply, ChatTurn } from "../services/chat";

const router = Router();

router.post("/chat", async (req, res, next) => {
  try {
    const { history, context } = req.body as { history?: ChatTurn[]; context?: string };
    const safe = Array.isArray(history) ? history : [];
    const reply = await chatReply(safe, context);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

export default router;

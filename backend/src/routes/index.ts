import { Router } from "express";
import health from "./health";
import analysis from "./analysis";
import scenarios from "./scenarios";
import chat from "./chat";
import coach from "./coach";
import readiness from "./readiness";
import savingsPlan from "./savingsPlan";
import checkin from "./checkin";

const router = Router();

router.use(health);
router.use(analysis);
router.use(scenarios);
router.use(chat);
router.use(coach);
router.use(readiness);
router.use(savingsPlan);
router.use(checkin);

export default router;

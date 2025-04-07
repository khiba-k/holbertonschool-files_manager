import { Router } from "express";
import { getStats, getStatus } from "../controllers/AppController";

const router = Router();

router.get("/status", async (req, res) => {
  const status = await getStatus();
  res.status(200).json(status);
});

router.get("/stats", async (req, res) => {
  const stats = await getStats();
  res.status(200).json(stats);
});

export default router;

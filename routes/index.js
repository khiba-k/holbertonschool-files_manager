import { Router } from "express";
import { getStats, getStatus } from "../controllers/AppController";

const router = Router();

// Get status route
router.get("/status", async (req, res) => {
  const status = await getStatus();
  res.status(200).json(status);
});

// Get stats route
router.get("/stats", async (req, res) => {
  const stats = await getStats();
  res.status(200).json(stats);
});

// Create new user route
router.post("users", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ Error: "Missing email" });
      console.log("Missing email");
    }

    if (!password) {
      res.status(400).json({ Error: "Missing password" });
      console.log("Missing password");
    }

    const post = postNew(email, password);

    if (!post) {
      res.status(400).json({ Error: "Already Exists" });
      console.log("Email already exists");
    }
  } catch (error) {
    console.log("An error occured: ", error);
  }
});

export default router;

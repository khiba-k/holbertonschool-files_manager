import { Router } from "express";
import { getStats, getStatus } from "../controllers/AppController";
import getConnect from "../controllers/AuthController";
import postNew from "../controllers/UsersController";

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
router.post("/users", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for email
    if (!email) {
      console.log("Missing email");
      return res.status(400).json({ Error: "Missing email" });
    }

    // Check for password
    if (!password) {
      console.log("Missing password");
      return res.status(400).json({ Error: "Missing password" });
    }

    // Post New User
    const postedUser = await postNew(email, password);

    if (postedUser == false) {
      console.log("Email already exists");
      return res.status(400).json({ Error: "Already Exists" });
    } else {
      console.log("User created successfully");
      return res.status(201).json(postedUser);
    }
  } catch (error) {
    console.log("An error occured when posting user: ", error);
  }
});

// Get connect route
router.get("/connect", async (req, res) => {
  try {
    // Get email and password key:value pair
    const { authorization } = req.headers;

    if (authorization) {
      const emailPassPair = authorization.split(" ")[1];

      const isUserConnected = await getConnect(emailPassPair);
      if (isUserConnected == false) {
        return res.status(401).json({ Error: "Unauthorized" });
      } else {
        return res.status(200).json({ token: isUserConnected });
      }
    } else {
      console.log("authorization Header is missing or incorrect.");
    }
  } catch (error) {
    console.log("An error occured while logging in: ", error);
  }
});

// Disconnect route
router.get("/disconnect", (req, res) => {});

// Get user route
router.get("/users/me", (req, res) => {});

export default router;

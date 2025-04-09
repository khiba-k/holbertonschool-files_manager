import { Router } from "express";
import { getStats, getStatus } from "../controllers/AppController";
import {
  disconnect,
  getConnect,
  getCurrentUser,
} from "../controllers/AuthController";
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
        return res.status(401).json({ error: "Unauthorized" });
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
router.get("/disconnect", async (req, res) => {
  try {
    const token = req.headers["x-token"];

    if (token) {
      const deleteSession = await disconnect(token);

      if (deleteSession) {
        return res.status(204).send("");
      } else {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }
  } catch (error) {
    console.log("Error disconnecting: ", error);
  }
});

// Get user route
router.get("/users/me", async (req, res) => {
  try {
    const token = req.headers["x-token"];

    if (token) {
      const user = await getCurrentUser(token);

      if (user == false) {
        return res.status(401).json({ error: "Unauthorized" });
      } else {
        const { email, _id } = user;
        const userObj = { id: _id, email: email };
        res.status(201).json(userObj);
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (error) {
    console.log("Error getting current user details: ", error);
  }
});

export default router;

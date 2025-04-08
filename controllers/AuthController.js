import { v4 as uuidv4 } from "uuid";
import dbClient from "../utils/db.mjs";
import redisClient from "../utils/redis.mjs";

const getConnect = async (emailPassPair) => {
  try {
    // Decode key value pair
    const decodedString = Buffer.from(emailPassPair, "base64").toString(
      "utf-8"
    );
    const emailPassArr = decodedString.split(":");
    const email = emailPassArr[0];
    const password = emailPassArr[1];

    // Check if user exists
    const userExists = await dbClient.checkUser(email, password);

    if (userExists == false) {
      return false;
    } else {
      // Create token for user
      const userToken = uuidv4();

      //   Create session and store in redis
      const userId = String(userExists);
      const sessionKey = `auth_${userToken}`;
      await redisClient.set(sessionKey, userId, 86400);

      return userToken;
    }
  } catch (error) {
    console.log("Error getting token: ", error);
  }
};

const disconnect = async (token) => {
  try {
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId == null) {
      console.log("Token does not exist");
      return false;
    } else {
      // If token exists delete the key value pair
      await redisClient.del(key);
      return true;
    }
  } catch (error) {
    console.log("Error deleting session: ", error);
  }
};

const getCurrentUser = async (token) => {
  try {
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId == null) {
      console.log("Token does not exist");
      return false;
    } else {
      const user = await dbClient.getUser(userId);

      if (user == false) {
        return false;
      } else {
        return user;
      }
    }
  } catch (error) {
    console.log("Error fetching current user: ", error);
  }
};

export { disconnect, getConnect, getCurrentUser };

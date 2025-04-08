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
      const userId = userExists;
      const sessionKey = `auth_${userToken}`;
      await redisClient.set(sessionKey, userId, 86400);
      console.log("UserId: ", userId);

      return userToken;
    }
  } catch (error) {
    console.log("Error getting token: ", error);
  }
};

export default getConnect;

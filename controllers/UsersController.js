import { createHash } from "crypto";
import dbClient from "../utils/db.mjs";

const postNew = async (email, password) => {
  try {
    const emailExists = await dbClient.checkEmail(email);

    if (emailExists >= 1) {
      return false;
    } else {
      const hashedPass = createHash("sha1").update(password).digest("hex");
      const userId = await dbClient.createUser(email, hashedPass);

      return { id: userId, email: email };
    }
  } catch (error) {
    console.log("An error occured while posting new user: ", error);
  }
};

export default postNew;

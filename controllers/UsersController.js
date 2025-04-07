import dbClient from "../utils/db.mjs";
const postNew = async (email, password) => {
  try {
    const emailExists = await dbClient.checkEmail(email);

    if (emailExists >= 1) {
      return false;
    } else {
    }
  } catch (error) {
    console.log("An error occured: ", error);
  }
};

export default postNew;

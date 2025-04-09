import dbClient from "../utils/db.mjs";
import redisClient from "../utils/redis.mjs";

const postUpload = async (
  token,
  name,
  type,
  parentId = 0,
  data = null,
  isPublic = false
) => {
  try {
    // Get user by token
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId == null) {
      return { success: false, message: "User not found" };
    } else {
      if (parentId != 0) {
        // Check if file with parent id exists
        const parent = await dbClient.checkFileId(parentId);

        if (!parent) {
          return { success: false, message: "Parent file not found" };
        } else {
          const parentType = parent["type"];
          const fileUserId = parent["userId"];

          if (parentType != "folder") {
            return { success: false, message: "Parent is not folder" };
          }
          if (fileUserId != userId) {
            return {
              success: false,
              message: "User does not have access to file",
            };
          }
        }
      }

      //   Save to db
      if (type == "folder") {
        const folder = await dbClient.saveFile(
          userId,
          name,
          type,
          isPublic,
          parentId
        );

        return { success: true, data: folder };
      }
    }
  } catch (error) {
    console.log("Error posting upload: ", error);
  }
};

export default postUpload;

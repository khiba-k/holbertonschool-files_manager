import fs from "fs";
import path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import dbClient from "../utils/db.mjs";
import redisClient from "../utils/redis.mjs";

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

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
      } else {
        // Handle file or image types
        // Create the folder path if it doesn't exist
        const folderPath = process.env.FOLDER_PATH || "/tmp/files_manager";

        try {
          await mkdir(folderPath, { recursive: true });
        } catch (err) {
          if (err.code !== "EEXIST") {
            console.error(`Error creating directory: ${err}`);
            return {
              success: false,
              message: "Error creating storage directory",
            };
          }
        }

        // Generate a unique filename using UUID
        const filename = uuidv4();
        const localPath = path.join(folderPath, filename);

        // Decode and save the file
        if (data) {
          const fileData = Buffer.from(data, "base64");
          await writeFile(localPath, fileData);
        } else {
          // Create an empty file if no data provided
          await writeFile(localPath, "");
        }

        // Save file info to database
        const file = await dbClient.saveFile(
          userId,
          name,
          type,
          isPublic,
          parentId,
          localPath
        );

        return { success: true, data: file };
      }
    }
  } catch (error) {
    console.log("Error posting upload: ", error);
  }
};

export default postUpload;

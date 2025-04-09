import { createHash } from "crypto";
import pkg from "mongodb";

const { MongoClient, ObjectId } = pkg;

const host = process.env.DB_HOST || "localhost";
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || "files_manager";
const url = `mongodb://${host}:${port}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.db = null;
    this.client
      .connect()
      .then(() => {
        this.db = this.client.db(database);
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err);
        this.db = null;
      });
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    if (!this.db) return 0;
    return this.db.collection("users").countDocuments();
  }

  async nbFiles() {
    if (!this.db) return 0;
    return this.db.collection("files").countDocuments();
  }

  async checkEmail(email) {
    if (!this.db) return 0;
    return await this.db.collection("users").countDocuments({ email: email });
  }

  async createUser(email, password) {
    try {
      const user = { email: email, password: password };
      const newUser = await this.db.collection("users").insertOne(user);
      return newUser.insertedId;
    } catch (error) {
      console.log("Error creating new user: ", error);
    }
  }

  async checkUser(email, password) {
    try {
      const user = await this.db.collection("users").findOne({ email: email });

      if (user) {
        const userPassword = user["password"];

        // Check if entered password matches user password
        const hashedPassword = createHash("sha1")
          .update(password)
          .digest("hex");

        if (hashedPassword == userPassword) {
          return user["_id"];
        } else {
          console.log("Incorrect password");
          return false;
        }
      } else {
        console.log("Email does not exist");
        return false;
      }
    } catch (error) {
      console.log("Error checking user: ", error);
    }
  }

  async getUser(userId) {
    try {
      const user = await this.db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });
      console.log("User: ", user);

      if (user) {
        return user;
      } else {
        return false;
      }
    } catch (error) {
      console.log("Error getting user: ", error);
    }
  }

  async checkFileId(fileId) {
    try {
      const file = await this.db
        .collection("files")
        .findOne({ _id: new ObjectId(fileId) });
      return file;
    } catch (error) {
      console.log("Error checking for file with parentId: ", error);
    }
  }

  async saveFile(userId, name, type, isPublic, parentId) {
    try {
      const folder = await this.db.collection("files").insertOne({
        userId: userId,
        name: name,
        type: type,
        isPublic: isPublic,
        parentId: parentId,
      });

      const folderObj = {
        id: folder.insertedId,
        userId: userId,
        name: name,
        type: type,
        isPublic: isPublic,
        parentId: parentId,
      };

      return folderObj;
    } catch (error) {
      console.log("Error saving file to database", error);
    }
  }
}

const dbClient = new DBClient();
export default dbClient;

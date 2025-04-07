import pkg from "mongodb";
const { MongoClient } = pkg;

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

  // Count number of users
  async nbUsers() {
    try {
      const db = this.client.db(this.database);
      const users = db.collection("users");
      const numOfusers = await users.countDocuments();
      return numOfusers;
    } catch (error) {
      console.log("Error fetching number of users: ", error);
    }
  }

  async nbFiles() {
    try {
      const db = this.client.db(this.database);
      const files = db.collection("files");
      const numOfFiles = await files.countDocuments();

      return numOfFiles;
    } catch (error) {
      console.log("Error fetching number of files");
    }
  }
}

const dbClient = new DBClient();
export default dbClient;

import pkg from "mongodb";
const { MongoClient } = pkg;

class DBClient {
  constructor() {
    try {
      const host = process.env.DB_HOST || "localhost";
      const port = process.env.DB_PORT || "27017";
      this.database = process.env.DB_DATABASE || "files_manager";

      const uri = `mongodb://${host}:${port}/${this.database}`;

      this.client = MongoClient(uri);
    } catch (error) {
      console.log("Error establishing mongo connection: ".error);
    }
  }

  // Check if connection is successful
  async isAlive() {
    try {
      // Connect to db
      await this.client.connect();

      // Check if connection successful
      await this.client.db(this.database).command({ ping: 1 });
      console.log("Successfully connected to MongoDB");
      return true;
    } catch (error) {
      console.log("Failed to connect to MongoDB");
      return false;
    }
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

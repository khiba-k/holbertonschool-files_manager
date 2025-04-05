// utils/db.mjs

import { MongoClient } from "mongodb";
import process from "process";

export class DBClient {
  constructor() {
    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || 27017;
    const dbName = process.env.DB_DATABASE || "files_manager";

    const uri = `mongodb://${host}:${port}`;
    this.client = new MongoClient(uri, { useUnifiedTopology: true });

    this.db = null;

    this.client
      .connect()
      .then(() => {
        this.db = this.client.db(dbName);
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err.message);
      });
  }

  isAlive() {
    return (
      this.client && this.client.topology && this.client.topology.isConnected()
    );
  }

  async nbUsers() {
    if (!this.isAlive()) return 0;
    return this.db.collection("users").countDocuments();
  }

  async nbFiles() {
    if (!this.isAlive()) return 0;
    return this.db.collection("files").countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;

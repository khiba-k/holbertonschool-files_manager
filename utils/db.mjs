// utils/db.mjs (modified version with safer methods)
import mongodb from 'mongodb';

const { MongoClient } = mongodb;

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    MongoClient.connect(url, { useUnifiedTopology: true }, (error, client) => {
      if (!error) {
        this.db = client.db(DB_DATABASE);
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      } else {
        console.log(error.message);
        this.db = false;
      }
    });
  }

  isAlive() {
    return !!this.db;
  }

  async nbUsers() {
    if (!this.isAlive() || !this.users) {
      return 0;
    }
    try {
      const userCount = await this.users.countDocuments();
      return userCount;
    } catch (error) {
      console.error('Error counting users:', error.message);
      return 0;
    }
  }

  async nbFiles() {
    if (!this.isAlive() || !this.files) {
      return 0;
    }
    try {
      const fileCount = await this.files.countDocuments();
      return fileCount;
    } catch (error) {
      console.error('Error counting files:', error.message);
      return 0;
    }
  }
}

const dbClient = new DBClient();

export default dbClient;

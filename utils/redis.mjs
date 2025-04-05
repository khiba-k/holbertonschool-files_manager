import redis from "redis";

class RedisClient {
  constructor() {
    // Connect to redis server
    this.client = redis.createClient();

    this.client.on("error", (err) => {
      console.error("Redis error:", err);
    });
  }

  // Check if client connected to server successfully
  isAlive() {
    return this.client.connected;
  }

  // Get stored value by key
  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  // Set key value pair with duration
  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, value, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  // Delete key value pair
  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}

const redisClient = new RedisClient();
export default redisClient;

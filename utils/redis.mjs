import { createClient } from "redis";

class RedisClient {
  constructor() {
    // Instantiate connection to redis-server
    this.client = createClient();

    this.client.on("error", (err) => {
      console.log("Error: ", err);
    });

    // Add a listener for the "connect" event to set the connected flag
    this.client.on("connect", () => {
      this.connected = true;
      console.log("Redis connected!");
    });
  }

  // Check if connection is successful
  isAlive() {
    return this.connected || false;
  }

  // Get value of specific key
  async get(key) {
    return await this.client.get(key);
  }

  // Set key value pair with duration
  async set(key, value, duration) {
    await this.client.set(key, value, "EX", duration);
  }

  // Delete key and it's value
  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;

// utils/redis.mjs
import redis from 'redis';
import { promisify } from 'util';

/**
 * RedisClient - A utility class for Redis operations
 *
 * This class provides a simplified interface for common Redis operations
 * such as checking connection status, getting, setting, and deleting values.
 * It's designed to be used as a singleton throughout the application.
 */
class RedisClient {
  /**
   * Initializes a new Redis client connection
   *
   * Sets up the Redis client with default connection settings and
   * configures error handling. Also promisifies key Redis methods
   * for easier async/await usage.
   */
  constructor() {
    // Create Redis client with default connection parameters (localhost:6379)
    this.client = redis.createClient();

    // Set up error handler to log any Redis connection issues
    this.client.on('error', (error) => {
      console.error(`Redis client error: ${error.message}`);
    });

    // Promisify Redis methods to work with modern async/await syntax
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setexAsync = promisify(this.client.setex).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  /**
   * Checks if the Redis connection is alive
   *
   * @returns {boolean} - Returns true if connected to Redis, false otherwise
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Retrieves a value from Redis by key
   *
   * @param {string} key - The key to retrieve
   * @returns {Promise<string|null>} - The value associated with the key, or null if not found
   */
  async get(key) {
    return this.getAsync(key);
  }

  /**
   * Stores a value in Redis with automatic expiration
   *
   * @param {string} key - The key under which to store the value
   * @param {*} value - The value to store
   * @param {number} duration - Time in seconds before the key expires
   * @returns {Promise<void>}
   */
  async set(key, value, duration) {
    return this.setexAsync(key, duration, value);
  }

  /**
   * Removes a value from Redis
   *
   * @param {string} key - The key to delete
   * @returns {Promise<number>} - Number of keys removed (0 or 1)
   */
  async del(key) {
    return this.delAsync(key);
  }
}

// Create a singleton instance of RedisClient to be used throughout the application
const redisClient = new RedisClient();
export default redisClient;

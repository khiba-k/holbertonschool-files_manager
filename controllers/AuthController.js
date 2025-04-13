// controllers/AuthController.js
import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  /**
   * Authenticates a user and generates an access token
   * 
   * Uses Basic Authentication to validate credentials and generates
   * a unique token stored in Redis for subsequent authenticated requests.
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with token or error
   */
  static async getConnect(req, res) {
    // Extract and decode Basic Authentication header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract credentials from Basic Auth header
    // Format: Basic base64(email:password)
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user with matching email and password
    try {
      const hashedPassword = sha1(password);
      const user = await dbClient.db.collection('users').findOne({
        email,
        password: hashedPassword,
      });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Generate a token and store it in Redis
      const token = uuidv4();
      const key = `auth_${token}`;
      
      // Store user ID in Redis with 24-hour expiration (86400 seconds)
      await redisClient.set(key, user._id.toString(), 86400);

      return res.status(200).json({ token });
    } catch (error) {
      console.error('Authentication error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Signs out a user by invalidating their token
   * 
   * Removes the token from Redis, effectively logging the user out
   * and preventing further access using that token.
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Empty response with status code 204 on success
   */
  static async getDisconnect(req, res) {
    // Get token from X-Token header
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user ID associated with the token
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete the token from Redis
    await redisClient.del(key);

    // Return no content (successful logout)
    return res.status(204).end();
  }
}

export default AuthController;

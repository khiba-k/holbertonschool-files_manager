// controllers/UsersController.js
import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  /**
   * Creates a new user in the database
   *
   * This endpoint handles user registration with validation for required fields
   * and uniqueness checks for email. Passwords are securely hashed using SHA1.
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with user data or error message
   */
  static async postNew(req, res) {
    // Extract user data from request body
    const { email, password } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if user already exists
    try {
      const existingUser = await dbClient.db.collection('users').findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Create new user with hashed password
      const hashedPassword = sha1(password);
      const result = await dbClient.db.collection('users').insertOne({
        email,
        password: hashedPassword,
      });

      // Return new user data
      return res.status(201).json({
        id: result.insertedId.toString(),
        email,
      });
    } catch (error) {
      console.error('Error creating user:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Add this method to your existing UsersController class
  /**
   * Retrieves the current user's profile
   *
   * Identifies the user based on their authentication token and
   * returns their profile information (email and ID).
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with user data or error
   */
  static async getMe(req, res) {
    // Get token from X-Token header
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from Redis
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user in database
    try {
      const user = await dbClient.db.collection('users')
        .findOne({ _id: new require('mongodb').ObjectId(userId) });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return user information (email and ID only)
      return res.status(200).json({
        id: userId,
        email: user.email,
      });
    } catch (error) {
      console.error('Error retrieving user:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;

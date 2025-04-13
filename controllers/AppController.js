// controllers/AppController.js
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * Returns the status of Redis and MongoDB connections
   */
  static getStatus(req, res) {
    const status = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };
    
    return res.status(200).json(status);
  }

  /**
   * Returns statistics about users and files in the database
   */
  static async getStats(req, res) {
    try {
      const stats = {
        users: await dbClient.nbUsers(),
        files: await dbClient.nbFiles(),
      };
      
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Error getting stats:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default AppController;

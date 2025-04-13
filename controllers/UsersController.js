import sha1 from 'sha1';
import { ObjectID } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const userExist = await dbClient.db.collection('users').findOne({ email });
      if (userExist) {
        return res.status(400).json({ error: 'Already exist' });
      }
      const hashedPass = sha1(password);
      const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPass });
      return res.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');
    const userID = await redisClient.get(`auth_${token}`);

    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: new ObjectID(userID) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: user._id, email: user.email });
  }
}

export default UsersController;

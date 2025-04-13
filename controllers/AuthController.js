import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const base64Credentials = authHeader.split(' ')[1];
    const credential = Buffer.from(base64Credentials, 'base64').toString();
    const [email, password] = credential.split(':');

    const hashedPass = sha1(password);
    const user = await dbClient.db.collection('users').findOne({ email, password: hashedPass });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    const expiration = 24 * 3600;
    await redisClient.set(key, user._id.toString(), expiration);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const userID = await redisClient.get(`auth_${token}`);
    if (!userID) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(`auth_${token}`);

    return res.status(204).send();
  }
}

export default AuthController;

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const getStatus = async () => {
  const redisConnect = redisClient.isAlive();
  const mongoConnect = dbClient.isAlive();

  if (redisConnect && mongoConnect) {
    return { redis: redisConnect, db: mongoConnect };
  }
};

const getStats = async () => {
  const users = await dbClient.nbUsers();
  const files = await dbClient.nbFiles();

  return { users, files };
};

export { getStats, getStatus };

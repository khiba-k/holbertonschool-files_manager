import dbClient from "../utils/db.mjs";
import redisClient from "../utils/redis.mjs";

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

  return { users: users, files: files };
};

export { getStats, getStatus };

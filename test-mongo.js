import dbClient from './utils/db.mjs';

const testMongo = async () => {
  const isConnected = await dbClient.isAlive();

  if (isConnected) {
    const users = await dbClient.nbUsers();
    console.log(`Number of users: ${users}`);

    const files = await dbClient.nbFiles();
    console.log(`Number of files: ${users}`);
  }
};

testMongo();

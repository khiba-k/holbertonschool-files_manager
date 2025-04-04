import { createClient } from "redis";

async function connectRedis() {
  const client = createClient();

  client.on("connect", () => {
    console.log("Client connected successfully");
  });
}

connectRedis();

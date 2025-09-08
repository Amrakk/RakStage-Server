import crypto from "crypto";
import { db } from "./database/db.js";
import Redis from "./database/redis.js";
import { HOST, IS_PROD, SERVER_NAME } from "./constants.js";
import messageBroker from "./services/messageBroker/index.js";

export let serverId = `${SERVER_NAME}-${crypto.randomUUID()}`;

export async function init() {
    await Promise.all([db.init(), Redis.init()]);

    const cache = Redis.getRedis();

    const servers = await cache.smembers(SERVER_NAME);
    const serverDetails = await Promise.all(
        servers.map(async (serverId) => ({ id: serverId, details: await cache.hgetall(serverId) }))
    );

    const existedServer = serverDetails.find((server) => server.details.host === HOST);
    if (existedServer) {
        if (IS_PROD) throw new Error("Server already exists");
        else await cache.srem(SERVER_NAME, existedServer.id);
    }

    while (true) {
        const isExist = servers.includes(serverId);
        if (!isExist) break;
        serverId = `${SERVER_NAME}-${crypto.randomUUID()}`;
    }

    await cache.sadd(SERVER_NAME, serverId);
    await cache.hset(serverId, "host", HOST, "load", 0);
    await messageBroker.start();

    console.log(`Server ID: ${serverId}`);
}

export async function close() {
    console.log("\n\n===== Closing Server =====");

    const cache = Redis.getRedis();
    if (!IS_PROD) await cache.flushall();

    await Promise.all([cache.srem(SERVER_NAME, serverId), messageBroker.stop()]);
    await Promise.all([db.close(), Redis.close()]);

    console.log("Server closed");
    process.exit(0);
}

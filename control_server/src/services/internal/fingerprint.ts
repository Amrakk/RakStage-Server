import { randomUUID } from "crypto";
import { serverId } from "../../core.js";
import redis from "../../database/redis.js";
import messageBroker from "../messageBroker/index.js";
import { FINGERPRINT_ACTIONS, FINGERPRINT_EVENTS } from "../../constants.js";

import BadRequestError from "../../errors/BadRequestError.js";
import ServiceResponseError from "../../errors/ServiceResponseError.js";

import type { ObjectId } from "mongooat";
import type { IUser, IUserSimplify } from "../../interfaces/database/user.js";
import UserService from "./user.js";
import NotFoundError from "../../errors/NotFoundError.js";

type FingerprintCacheData = {
    location: string;
    userId?: string;
    state: "pending_remote_init" | "pending_ticket";
};

export class FingerprintService {
    private static ticketPrefix = "ticket";
    private static fingerprintPrefix = "fingerprint";

    public static async generateFingerprint(ttl: number): Promise<string> {
        const fingerprint = randomUUID();

        const cache = redis.getRedis();
        const cacheData: FingerprintCacheData = {
            location: serverId,
            state: "pending_remote_init",
        };

        await cache.set(
            `${this.fingerprintPrefix}-${fingerprint}`,
            JSON.stringify(cacheData),
            "EX",
            Math.floor(ttl / 1000)
        );

        return fingerprint;
    }

    public static async getFingerprintCacheData(fingerprint: string): Promise<FingerprintCacheData | null> {
        const cache = redis.getRedis();
        const data = await cache.get(`${this.fingerprintPrefix}-${fingerprint}`);

        if (!data) return null;
        return JSON.parse(data);
    }

    public static async validateFingerprint(fingerprint: string, user: IUserSimplify): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
                const cacheData = await this.getFingerprintCacheData(fingerprint);
                if (!cacheData) throw new BadRequestError("Invalid QR Code");

                const actionId = randomUUID();
                const data = { actionId, data: { user, fingerprint } };

                const listener = messageBroker.createListener<FINGERPRINT_EVENTS.DETECTED_ACK>(async (response) => {
                    if (response.actionId !== actionId) return;
                    messageBroker.off(FINGERPRINT_EVENTS.DETECTED_ACK, listener);

                    const cache = redis.getRedis();

                    cacheData.state = "pending_ticket";
                    cacheData.userId = `${user._id}`;

                    await cache.set(`${this.fingerprintPrefix}-${fingerprint}`, JSON.stringify(cacheData), "EX", 60);

                    resolve(true);
                });

                messageBroker.on(FINGERPRINT_EVENTS.DETECTED_ACK, listener);
                await messageBroker.publish(cacheData.location, FINGERPRINT_EVENTS.DETECTED, data);
            } catch (error) {
                reject(error);
            }
        });
    }

    public static async fingerprintAction(
        fingerprint: string,
        userId: ObjectId | string,
        action: FINGERPRINT_ACTIONS
    ): Promise<boolean> {
        const cache = redis.getRedis();
        const cacheKey = `${this.fingerprintPrefix}-${fingerprint}`;
        const fingerprintCacheData = await this.getFingerprintCacheData(fingerprint);

        if (
            !fingerprintCacheData ||
            fingerprintCacheData.userId !== `${userId}` ||
            fingerprintCacheData.state !== "pending_ticket"
        ) {
            throw new BadRequestError("Invalid QR Code");
        }

        userId = `${userId}`;
        const actionId = randomUUID();
        const ticket = action === FINGERPRINT_ACTIONS.ACCEPT ? await this.generateTicket(userId) : undefined;
        const data = { actionId, data: { action, fingerprint, ticket } };

        return new Promise<boolean>((resolve, reject) => {
            try {
                const listener = messageBroker.createListener<FINGERPRINT_EVENTS.REMOTE_ACTION_ACK>(
                    async (response) => {
                        if (response.actionId !== actionId) return;
                        messageBroker.off(FINGERPRINT_EVENTS.REMOTE_ACTION_ACK, listener);

                        await cache.del(cacheKey);
                        resolve(true);
                    }
                );

                messageBroker.on(FINGERPRINT_EVENTS.REMOTE_ACTION_ACK, listener);
                messageBroker.publish(fingerprintCacheData.location, FINGERPRINT_EVENTS.REMOTE_ACTION, data);
            } catch (error) {
                reject(error);
            }
        });
    }

    private static async generateTicket(userId: ObjectId | string): Promise<string> {
        const ticket = randomUUID();

        const cache = redis.getRedis();
        await cache.set(`${this.ticketPrefix}-${ticket}`, `${userId}`, "EX", 60);

        return ticket;
    }

    public static async loginWithTicket(ticket: string): Promise<Omit<IUser, "password">> {
        const cache = redis.getRedis();
        const userId = await cache.get(`${this.ticketPrefix}-${ticket}`);

        if (!userId) throw new BadRequestError("Invalid ticket");

        const user = await UserService.getById(userId);
        if (!user) throw new NotFoundError("User not found");

        const { password, ...rest } = user;

        return rest;
    }
}

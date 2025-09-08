import { randomUUID } from "crypto";
import Redis from "../../database/redis.js";
import messageBroker from "../messageBroker/index.js";
import { INTERACTION_EVENTS } from "../../constants.js";

import ServiceResponseError from "../../errors/ServiceResponseError.js";

import type { ObjectId } from "mongooat";
import type { IResInteractionServer } from "../../interfaces/api/response.js";

export default class InteractionService {
    private static serviceName = "interaction-server";

    private static async getAvailableInteractionServer() {
        const cache = Redis.getRedis();
        const servers = await cache.smembers(this.serviceName);

        if (servers.length === 0) {
            throw new ServiceResponseError(
                this.name,
                "getAvailableInteractionServer",
                "No Interaction Servers available"
            );
        }

        const serverDetailsList = await Promise.all(
            servers.map(async (serverId) => {
                const details = await cache.hgetall(serverId);
                return {
                    id: serverId,
                    host: details.host ?? null,
                    load: parseInt(details.load ?? "0"),
                };
            })
        );

        const bestServer = serverDetailsList.reduce((prev, curr) => (curr.load < prev.load ? curr : prev));
        return bestServer;
    }

    public static async createStage(hostId: ObjectId, title: string): Promise<IResInteractionServer.JoinStage> {
        return new Promise<IResInteractionServer.JoinStage>(async (resolve, reject) => {
            try {
                const actionId = randomUUID();
                const message = { actionId, data: { title, hostId } };
                const server = await this.getAvailableInteractionServer();

                const listener = messageBroker.createListener<INTERACTION_EVENTS.STAGE_JOIN>((response) => {
                    if (response.actionId !== actionId) return;

                    messageBroker.off("error", errorListener);
                    messageBroker.off(INTERACTION_EVENTS.STAGE_CREATE, listener);

                    resolve(response.data);
                });

                const errorListener = messageBroker.createListener<"error">((err) => {
                    if (err.actionId !== actionId) return;
                    messageBroker.off("error", errorListener);
                    messageBroker.off(INTERACTION_EVENTS.STAGE_CREATE, listener);

                    reject(err.error);
                });

                messageBroker.on("error", errorListener);
                messageBroker.on(INTERACTION_EVENTS.STAGE_CREATE, listener);

                await messageBroker.publish(server.id, INTERACTION_EVENTS.STAGE_CREATE, message);
            } catch (error) {
                reject(error);
            }
        });
    }

    public static async joinStage(joinId: ObjectId, code: string): Promise<IResInteractionServer.JoinStage> {
        return new Promise<IResInteractionServer.JoinStage>(async (resolve, reject) => {
            try {
                // TODO: apply rate limit

                const actionId = crypto.randomUUID();
                const message = { actionId, data: { joinId, code } };
                const server = await this.getAvailableInteractionServer();

                const listener = messageBroker.createListener<INTERACTION_EVENTS.STAGE_JOIN>((response) => {
                    if (response.actionId !== actionId) return;

                    messageBroker.on("error", errorListener);
                    messageBroker.off(INTERACTION_EVENTS.STAGE_JOIN, listener);

                    resolve(response.data);
                });

                const errorListener = messageBroker.createListener<"error">((err) => {
                    if (err.actionId !== actionId) return;
                    messageBroker.off("error", errorListener);
                    messageBroker.off(INTERACTION_EVENTS.STAGE_CREATE, listener);

                    reject(err.error);
                });

                messageBroker.on("error", errorListener);
                messageBroker.on(INTERACTION_EVENTS.STAGE_JOIN, listener);

                await messageBroker.publish(server.id, INTERACTION_EVENTS.STAGE_JOIN, message);
            } catch (error) {
                reject(error);
            }
        });
    }
}

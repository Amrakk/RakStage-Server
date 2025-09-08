import StageService from "./internal/stage.js";
import messageBroker from "./messageBroker.js";
import { SocketManager } from "../socket/socketManager.js";
import { HOST, INTERACTION_EVENTS } from "../constants.js";
import { messageBrokerErrorHandler } from "../middlewares/errorHandler.js";

import NotFoundError from "../errors/NotFoundError.js";

import type { SubscriberEvents } from "./messageBroker.js";

export default class Publisher {
    public static async stageCreateEvent(
        reqServerId: string,
        actionId: string,
        data: SubscriberEvents[INTERACTION_EVENTS.STAGE_CREATE]
    ): Promise<void> {
        try {
            const { hostId, title } = data;
            const stage = await StageService.insert({ hostId, title, serverHost: HOST });

            const publishData = {
                actionId,
                data: { stage, token: await SocketManager.tokenGenerate(hostId) },
            };

            await messageBroker.publish(reqServerId, INTERACTION_EVENTS.STAGE_CREATE, publishData);
        } catch (error) {
            const responseData = await messageBrokerErrorHandler(error);
            await messageBroker.publish(reqServerId, INTERACTION_EVENTS.STAGE_CREATE, {
                actionId,
                error: responseData ?? error,
            });
        }
    }

    public static async stageJoinEvent(
        reqServerId: string,
        actionId: string,
        data: SubscriberEvents[INTERACTION_EVENTS.STAGE_JOIN]
    ): Promise<void> {
        try {
            const { joinId, code } = data;

            const stage = await StageService.getByCode(code);
            if (!stage) throw new NotFoundError("Stage not found");

            const publishData = {
                actionId,
                data: { stage, token: await SocketManager.tokenGenerate(joinId) },
            };
            await messageBroker.publish(reqServerId, INTERACTION_EVENTS.STAGE_JOIN, publishData);
        } catch (error) {
            const responseData = await messageBrokerErrorHandler(error);
            await messageBroker.publish(reqServerId, INTERACTION_EVENTS.STAGE_JOIN, {
                actionId,
                error: responseData ?? error,
            });
        }
    }
}

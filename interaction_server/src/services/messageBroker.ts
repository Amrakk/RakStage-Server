import { Redis } from "ioredis";
import { serverId } from "../core.js";
import Publisher from "./publisher.js";
import { INTERACTION_EVENTS, REDIS_URI } from "../constants.js";

import type { IStage, StageCode } from "../interfaces/database/stage.js";

type BaseEvent<T extends Record<string, unknown>> = {
    actionId: string;
    data?: T;
    error?: any;
};

type BaseSubscriberEvent<T extends Record<string, unknown> = Record<string, unknown>> = BaseEvent<T> & {
    event: INTERACTION_EVENTS;
    reqServerId: string;
};

export type PublishEvents = {
    [INTERACTION_EVENTS.STAGE_CREATE]: { stage: IStage; token: string };
    [INTERACTION_EVENTS.STAGE_JOIN]: { stage: IStage; token: string };
};

export type SubscriberEvents = {
    [INTERACTION_EVENTS.STAGE_CREATE]: { title: string; hostId: string };
    [INTERACTION_EVENTS.STAGE_JOIN]: { code: StageCode; joinId: string };
};

export class MessageBroker {
    public static instance: MessageBroker;

    private publisher: Redis;
    private subscriber: Redis;

    private constructor() {
        this.publisher = new Redis(REDIS_URI, { lazyConnect: true });
        this.subscriber = new Redis(REDIS_URI, { lazyConnect: true });
    }

    public static getInstance(): MessageBroker {
        if (!this.instance) this.instance = new MessageBroker();
        return this.instance;
    }

    public async publish<T extends keyof PublishEvents>(
        targetServerId: string,
        event: T,
        message: BaseEvent<PublishEvents[T]>
    ): Promise<void> {
        const messageData = {
            ...message,
            event,
        };

        await this.publisher.publish(targetServerId, JSON.stringify(messageData));
    }

    public async start(): Promise<void> {
        await Promise.all([this.publisher.connect(), this.subscriber.connect()]);

        await this.subscriber.subscribe(serverId, (err, count) => {});

        this.subscriber.on("message", (_, message) => {
            const { event, reqServerId, actionId, data } = JSON.parse(message) as BaseSubscriberEvent;

            if (event === INTERACTION_EVENTS.STAGE_CREATE) {
                Publisher.stageCreateEvent(
                    reqServerId,
                    actionId,
                    data as SubscriberEvents[INTERACTION_EVENTS.STAGE_CREATE]
                );
            }

            if (event === INTERACTION_EVENTS.STAGE_JOIN) {
                Publisher.stageJoinEvent(
                    reqServerId,
                    actionId,
                    data as SubscriberEvents[INTERACTION_EVENTS.STAGE_JOIN]
                );
            }
        });
    }

    public async stop(): Promise<void> {
        await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
    }
}

const messageBroker = MessageBroker.getInstance();
export default messageBroker;

import { Redis } from "ioredis";
import EventEmitter from "events";
import { serverId } from "../../core.js";
import onMessage from "./channels/index.js";
import { REDIS_URI, WS_BROADCAST_CHANNEL } from "../../constants.js";

import type { BaseEvent, PublishEvents, SubscriberEvents } from "../../interfaces/messageBroker/index.js";

export class MessageBroker extends EventEmitter<SubscriberEvents> {
    public static instance: MessageBroker;

    private publisher: Redis;
    private subscriber: Redis;

    private constructor() {
        super();
        this.publisher = new Redis(REDIS_URI, { lazyConnect: true });
        this.subscriber = new Redis(REDIS_URI, { lazyConnect: true });
        this.setMaxListeners(Infinity);
    }

    public static getInstance(): MessageBroker {
        if (!this.instance) this.instance = new MessageBroker();
        return this.instance;
    }

    public async publish<T extends keyof PublishEvents>(
        channel: string,
        event: T,
        message: BaseEvent<PublishEvents[T]>
    ): Promise<void> {
        const messageData = {
            ...message,
            event,
            reqServerId: serverId,
        };

        await this.publisher.publish(channel, JSON.stringify(messageData));
    }

    public async start(): Promise<void> {
        await Promise.all([this.publisher.connect(), this.subscriber.connect()]);

        await Promise.all([
            this.subscriber.subscribe(serverId, (err, count) => {}),
            this.subscriber.subscribe(WS_BROADCAST_CHANNEL, (err, count) => {}),
        ]);

        this.subscriber.on("error", (error) => this.emit("error", { error }));

        this.subscriber.on("message", onMessage.bind(this));
    }

    public async stop(): Promise<void> {
        await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
    }

    public createListener<T extends keyof SubscriberEvents>(
        listener: (...args: SubscriberEvents[T]) => void
    ): (...args: SubscriberEvents[T]) => void {
        return listener;
    }
}

const messageBroker = MessageBroker.getInstance();
export default messageBroker;

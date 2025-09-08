import type { ObjectId } from "mongooat";
import type { IStage } from "../external/stage.js";
import type { IUserSimplify } from "../database/user.js";
import type { FINGERPRINT_ACTIONS, FINGERPRINT_EVENTS, INTERACTION_EVENTS } from "../../constants.js";

export type MBEvents = INTERACTION_EVENTS | FINGERPRINT_EVENTS;

export type BaseEvent<T extends Record<string, unknown>> = {
    actionId: string;
    reqServerId?: string;
    data: T;
};

export type BaseSubscriberEvent = BaseEvent<Record<string, unknown>> & {
    event: MBEvents;
    error?: any;
};

export type PublishEvents = {
    [INTERACTION_EVENTS.STAGE_CREATE]: { title: string; hostId: ObjectId };
    [INTERACTION_EVENTS.STAGE_JOIN]: { code: string; joinId: ObjectId };

    [FINGERPRINT_EVENTS.DETECTED_ACK]: {};
    [FINGERPRINT_EVENTS.DETECTED]: { user: IUserSimplify; fingerprint: string };
    [FINGERPRINT_EVENTS.REMOTE_ACTION_ACK]: {};
    [FINGERPRINT_EVENTS.REMOTE_ACTION]: { action: FINGERPRINT_ACTIONS; ticket?: string; fingerprint: string };
};

export type StageSubscriberEvent = BaseEvent<{ stage: IStage; token: string }>;

export type FingerprintACKSubscriberEvent = BaseEvent<{}>;
export type FingerprintDetectedSubscriberEvent = BaseEvent<PublishEvents[FINGERPRINT_EVENTS.DETECTED]>;
export type FingerprintRemoteActionSubscriberEvent = BaseEvent<PublishEvents[FINGERPRINT_EVENTS.REMOTE_ACTION]>;

export type SubscriberEvents = {
    error: [error: { actionId?: string; error: any }];
    [INTERACTION_EVENTS.STAGE_CREATE]: [data: StageSubscriberEvent];
    [INTERACTION_EVENTS.STAGE_JOIN]: [data: StageSubscriberEvent];

    [FINGERPRINT_EVENTS.DETECTED_ACK]: [data: FingerprintACKSubscriberEvent];
    [FINGERPRINT_EVENTS.DETECTED]: [data: FingerprintDetectedSubscriberEvent];
    [FINGERPRINT_EVENTS.REMOTE_ACTION_ACK]: [data: FingerprintACKSubscriberEvent];
    [FINGERPRINT_EVENTS.REMOTE_ACTION]: [data: FingerprintRemoteActionSubscriberEvent];
};

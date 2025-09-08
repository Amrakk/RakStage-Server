import { handleResponse } from "./index.js";
import SocketManger from "../../../socket/socketManager.js";
import { FINGERPRINT_ACTIONS, FINGERPRINT_EVENTS, INTERACTION_EVENTS } from "../../../constants.js";

import type { MessageBroker } from "../index.js";
import type {
    BaseSubscriberEvent,
    StageSubscriberEvent,
    FingerprintDetectedSubscriberEvent,
    FingerprintRemoteActionSubscriberEvent,
} from "../../../interfaces/messageBroker/index.js";

export default async function handleServerMessage(this: MessageBroker, message: BaseSubscriberEvent) {
    const { event, actionId, data, error, reqServerId } = message;
    try {
        const refinedData = handleResponse(event, { data, error });

        if (event === INTERACTION_EVENTS.STAGE_CREATE || event === INTERACTION_EVENTS.STAGE_JOIN) {
            this.emit(event, { actionId, data: refinedData } as StageSubscriberEvent);
        } else if (event === FINGERPRINT_EVENTS.DETECTED) {
            const { fingerprint, user } = refinedData as FingerprintDetectedSubscriberEvent["data"];

            if (!reqServerId) return;
            SocketManger.sendPendingTicket(fingerprint, user);

            await this.publish(reqServerId, FINGERPRINT_EVENTS.DETECTED_ACK, { actionId, data: {} });
        } else if (event === FINGERPRINT_EVENTS.DETECTED_ACK) {
            this.emit(event, { actionId, data: {} });
        } else if (event === FINGERPRINT_EVENTS.REMOTE_ACTION) {
            const { fingerprint, ticket, action } = refinedData as FingerprintRemoteActionSubscriberEvent["data"];

            if (!reqServerId) return;
            if (action === FINGERPRINT_ACTIONS.ACCEPT && ticket) {
                SocketManger.sendPendingLogin(fingerprint, ticket);
            } else if (action === FINGERPRINT_ACTIONS.DECLINE) {
                SocketManger.sendCancel(fingerprint);
            }

            await this.publish(reqServerId, FINGERPRINT_EVENTS.REMOTE_ACTION_ACK, { actionId, data: {} });
        } else if (event === FINGERPRINT_EVENTS.REMOTE_ACTION_ACK) {
            this.emit(event, { actionId, data: {} });
        }
    } catch (error) {
        this.emit("error", { actionId, error });
    }
}

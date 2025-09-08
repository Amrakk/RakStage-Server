import {
    WS_CLOSE_CODE,
    WS_MAX_RETRIES,
    WS_CLOSE_REASON,
    WS_SEND_OPERATION,
    WS_TIMEOUT_INTERVAL,
    FINGERPRINT_MAX_TTL,
    FINGERPRINT_MIN_TTL,
    WS_RECEIVE_OPERATION,
    WS_HEARTBEAT_INTERVAL,
} from "../constants.js";
import { FingerprintService } from "../services/internal/fingerprint.js";

import ServiceResponseError from "../errors/ServiceResponseError.js";

import type { IncomingMessage } from "http";
import type { WSMessage } from "../interfaces/socket/index.js";
import type { IUserSimplify } from "../interfaces/database/user.js";

export default class SocketManger {
    private static socketCache = new Map<string, WebSocket>();

    public static async onWSSConnection(ws: WebSocket, req: IncomingMessage) {
        let timeoutId: NodeJS.Timeout;
        let retryCount = 0;
        let awaitingAck = false;
        const WS_TTL = Math.floor(
            Math.random() * (FINGERPRINT_MAX_TTL - FINGERPRINT_MIN_TTL + 1) + FINGERPRINT_MIN_TTL
        );
        const fingerprint = await FingerprintService.generateFingerprint(WS_TTL);
        SocketManger.socketCache.set(fingerprint, ws);

        const resetTimeout = () => {
            clearTimeout(timeoutId);
            retryCount = 0;
            awaitingAck = false;
            timeoutId = setTimeout(sendHeartbeat, WS_HEARTBEAT_INTERVAL);
        };

        const sendHeartbeat = () => {
            if (ws.readyState !== ws.OPEN) return;

            if (awaitingAck) {
                retryCount++;
                if (retryCount >= WS_MAX_RETRIES) {
                    ws.close(WS_CLOSE_CODE.TIMEOUT, WS_CLOSE_REASON.TIMEOUT);
                    return;
                }
            }

            awaitingAck = true;
            ws.send(JSON.stringify({ op: WS_SEND_OPERATION.HEARTBEAT, timestamp: Date.now() }));

            timeoutId = setTimeout(() => {
                if (awaitingAck) sendHeartbeat();
            }, WS_TIMEOUT_INTERVAL);
        };

        ws.send(
            JSON.stringify({
                op: WS_SEND_OPERATION.HELLO,
                timeout: WS_TTL,
                heartbeatInterval: WS_HEARTBEAT_INTERVAL,
            })
        );

        ws.send(
            JSON.stringify({
                op: WS_SEND_OPERATION.PENDING_REMOTE_INIT,
                fingerprint,
            })
        );

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data) as WSMessage<WS_RECEIVE_OPERATION>;
                switch (message.op) {
                    case WS_RECEIVE_OPERATION.HEARTBEAT_ACK:
                        resetTimeout();
                        break;
                    default:
                        throw new ServiceResponseError("SocketManager", "onWSSConnection", "Invalid operation", {
                            ws,
                            message,
                        });
                }
            } catch (err: any) {
                ws.send(JSON.stringify({ op: err?.op ?? "Unknown", error: err }));
            }
        };

        ws.onclose = () => {
            SocketManger.socketCache.delete(fingerprint);
            clearTimeout(timeoutId);
        };

        setTimeout(() => ws.close(WS_CLOSE_CODE.EXPIRED, WS_CLOSE_REASON.EXPIRED), WS_TTL);
        resetTimeout();
    }

    public static sendPendingTicket(fingerprint: string, user: IUserSimplify) {
        const ws = SocketManger.socketCache.get(fingerprint);

        if (!ws)
            throw new ServiceResponseError("SocketManager", "sendPendingTicket", "Socket not found", {
                fingerprint,
                user,
            });

        ws.send(JSON.stringify({ op: WS_SEND_OPERATION.PENDING_TICKET, user }));
    }

    public static sendCancel(fingerprint: string) {
        const ws = SocketManger.socketCache.get(fingerprint);

        if (!ws)
            throw new ServiceResponseError("SocketManager", "sendCancel", "Socket not found", {
                fingerprint,
            });

        ws.send(JSON.stringify({ op: WS_SEND_OPERATION.CANCEL }));
        ws.close(WS_CLOSE_CODE.FINGERPRINT_CANCELED, WS_CLOSE_REASON.FINGERPRINT_CANCELED);
    }

    public static sendPendingLogin(fingerprint: string, ticket: string) {
        const ws = SocketManger.socketCache.get(fingerprint);

        if (!ws)
            throw new ServiceResponseError("SocketManager", "sendPendingLogin", "Socket not found", {
                fingerprint,
                ticket,
            });

        ws.send(JSON.stringify({ op: WS_SEND_OPERATION.PENDING_LOGIN, ticket }));
    }
}

import type { WS_RECEIVE_OPERATION, WS_SEND_OPERATION } from "../../constants.js";

export type WSMessage<T extends WS_SEND_OPERATION | WS_RECEIVE_OPERATION> = WSMessageData<T> & { op: T };

type WSMessageData<T extends WS_SEND_OPERATION | WS_RECEIVE_OPERATION> = T extends WS_SEND_OPERATION.HELLO
    ? { timeout: number; heartbeatInterval: number }
    : T extends WS_SEND_OPERATION.HEARTBEAT | WS_RECEIVE_OPERATION.HEARTBEAT_ACK
    ? { timestamp: number }
    : T extends WS_SEND_OPERATION.PENDING_REMOTE_INIT
    ? { fingerprint: string }
    : T extends WS_SEND_OPERATION.PENDING_TICKET
    ? { user: string }
    : T extends WS_SEND_OPERATION.PENDING_LOGIN
    ? { ticket: string }
    : T extends WS_SEND_OPERATION.CANCEL
    ? {}
    : never;

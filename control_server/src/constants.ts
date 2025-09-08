import ms, { type StringValue } from "ms";

/******************/
/******************/
/**  ENVIRONMENT **/
/******************/
/******************/

// CORE
export const APP_NAME = process.env.APP_NAME!;
export const SERVER_NAME = process.env.SERVER_NAME ?? APP_NAME;
export const ENV = process.env.ENV!;
export const PORT = parseInt(process.env.PORT!);
export const SERVER_VERSION = process.env.SERVER_VERSION!;
export const HOST = process.env.HOST!;
export const ORIGIN = process.env.ORIGIN!;
export const CLIENT_URL = process.env.CLIENT_URL!;
export const SESSION_SECRET = process.env.SESSION_SECRET!;

export const IS_PROD = ENV === "production";

// SOCKET
export const WS_BROADCAST_CHANNEL = process.env.WS_BROADCAST_CHANNEL!;
export const WS_MAX_RETRIES = parseInt(process.env.WS_MAX_RETRIES!);
export const WS_MIN_TTL = ms(process.env.WS_MIN_TTL! as StringValue);
export const WS_MAX_TTL = ms(process.env.WS_MAX_TTL! as StringValue);
export const WS_TIMEOUT_INTERVAL = ms(process.env.WS_TIMEOUT_INTERVAL! as StringValue);
export const WS_HEARTBEAT_INTERVAL = ms(process.env.WS_HEARTBEAT_INTERVAL! as StringValue);

// GMAIL
export const EMAIL = process.env.EMAIL!;
export const EMAIL_PASS = process.env.EMAIL_PASS!;

// DEFAULT
export const DEFAULT_AVATAR_URL = process.env.DEFAULT_AVATAR_URL!;

// AUTH
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

// DATABASE
export const MONGO_URI = process.env.MONGO_URI!;
export const MONGO_DEFAULT_DB = process.env.MONGO_DEFAULT_DB ?? APP_NAME;
export const REDIS_URI = process.env.REDIS_URI!;

// LOG
export const LOG_FOLDER = process.env.LOG_FOLDER ?? "logs";
export const ERROR_LOG_FILE = process.env.ERROR_LOG_FILE ?? "error.log";
export const REQUEST_LOG_FILE = process.env.REQUEST_LOG_FILE ?? "request.log";

// IMGBB
export const IMGBB_API_KEY = process.env.IMGBB_API_KEY!;
export const IMGBB_API_URL = process.env.IMGBB_API_URL!;

// GOOGLE AUTH
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
export const GOOGLE_REDIRECT_PATH = process.env.GOOGLE_REDIRECT_PATH!;
export const GOOGLE_FAILURE_REDIRECT_PATH = process.env.GOOGLE_FAILURE_REDIRECT_PATH!;

// DISCORD AUTH
export const DISCORD_ORIGIN = process.env.DISCORD_ORIGIN!;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

/******************/
/******************/
/**     ENUM     **/
/******************/
/******************/
// API
export enum RESPONSE_CODE {
    SUCCESS = 0,
    UNAUTHORIZED = 1,
    FORBIDDEN = 3,
    NOT_FOUND = 4,
    BAD_REQUEST = 5,
    VALIDATION_ERROR = 8,
    TOO_MANY_REQUESTS = 9,
    TIMEOUT = 10,

    SERVICE_UNAVAILABLE = 99,
    INTERNAL_SERVER_ERROR = 100,
}

export enum RESPONSE_MESSAGE {
    SUCCESS = "Operation completed successfully",
    UNAUTHORIZED = "Access denied! Please provide valid authentication",
    FORBIDDEN = "You don't have permission to access this resource",
    NOT_FOUND = "Resource not found! Please check your data",
    BAD_REQUEST = "The request could not be understood or was missing required parameters",
    VALIDATION_ERROR = "Input validation failed! Please check your data",
    TOO_MANY_REQUESTS = "Too many requests! Please try again later",

    TIMEOUT = "Request timeout! Please try again later",
    SERVICE_UNAVAILABLE = "Service is temporarily unavailable! Please try again later",
    INTERNAL_SERVER_ERROR = "An unexpected error occurred! Please try again later.",
}

// WEBSOCKET
export enum WS_CLOSE_CODE {
    TIMEOUT = 1,
    EXPIRED = 2,
    FINGERPRINT_CANCELED = 3,
}

export enum WS_CLOSE_REASON {
    TIMEOUT = "Connection timeout",
    EXPIRED = "Connection expired",
    FINGERPRINT_CANCELED = "Fingerprint canceled",
}

export enum WS_SEND_OPERATION {
    HELLO = "hello",
    HEARTBEAT = "heartbeat",
    PENDING_REMOTE_INIT = "pending_remote_init",
    PENDING_TICKET = "pending_ticket",
    PENDING_LOGIN = "pending_login",
    CANCEL = "cancel",
}

export enum WS_RECEIVE_OPERATION {
    HEARTBEAT_ACK = "heartbeat_ack",
}

// USER
export enum USER_ROLE {
    ADMIN = 0,
    USER = 1,
    UNKNOWN = 99,
}

export enum USER_STATUS {
    ACTIVE = 0,
    INACTIVE = 1,
    BANNED = 2,
}

export enum SOCIAL_MEDIA_PROVIDER {
    GOOGLE = "google",
    DISCORD = "discord",
}

// MB - Interaction Server
export enum INTERACTION_EVENTS {
    STAGE_CREATE = "stage_create",
    STAGE_JOIN = "stage_join",
}

export enum STAGE_STATUS {
    LIVE = 0,
    ENDED = 1,
}

// MB - FINGERPRINT
export enum FINGERPRINT_EVENTS {
    DETECTED = "fingerprint_detected",
    DETECTED_ACK = "fingerprint_detected_ack",
    REMOTE_ACTION = "fingerprint_remote_action",
    REMOTE_ACTION_ACK = "fingerprint_remote_action_ack",
}

export enum FINGERPRINT_ACTIONS {
    ACCEPT = 0,
    DECLINE = 1,
}

// PASSKEY
/** type AuthenticatorTransportFuture = 'ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb'*/
export enum PASSKEY_TRANSPORT {
    BLE = "ble",
    CABLE = "cable",
    HYBRID = "hybrid",
    INTERNAL = "internal",
    NFC = "nfc",
    SMART_CARD = "smart-card",
    USB = "usb",
}

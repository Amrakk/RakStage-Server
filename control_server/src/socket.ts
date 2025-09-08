import { WebSocketServer } from "ws";
import { SERVER_VERSION } from "./constants.js";
import SocketManger from "./socket/socketManager.js";
import { errorLogger } from "./middlewares/logger/loggers.js";

import type { Server } from "http";

export const WebSocketInit = (server: Server) => {
    const wss = new WebSocketServer({ server, path: `/socket/${SERVER_VERSION}` });

    wss.on("connection", SocketManger.onWSSConnection);

    wss.on("error", (err) => errorLogger(err));

    wss.on("close", () => {
        console.log("WebSocket server closed");
    });

    console.log("WebSocket server configured");
    return wss;
};

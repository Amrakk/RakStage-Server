import { Server as WSServer } from "socket.io";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "./constants.js";

import type { Server } from "http";
import { SocketManager } from "./socket/socketManager.js";
import { errorLogger } from "./middlewares/logger/loggers.js";

export const wssConfigure = (server: Server) => {
    const wss = new WSServer(server, { path: "/wss" });

    wss.on("connection", SocketManager.onWSSConnection);

    wss.on("error", (err) => errorLogger(err));

    wss.on("close", () => {
        console.log("WebSocket server closed");
    });

    console.log("WebSocket server configured");
    return wss;
};

import cors from "cors";
import express from "express";
import passport from "passport";
import router from "./routes/api.js";
import session from "express-session";
import { WebSocketInit } from "./socket.js";
import { init, close } from "./core.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/logger/loggers.js";
import { IS_PROD, SERVER_VERSION, CLIENT_URL, PORT, SESSION_SECRET, ORIGIN } from "./constants.js";

const app = express();

app.use(
    cors({
        origin: [CLIENT_URL, "http://localhost:5000"],
        credentials: true,
    })
);

app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: IS_PROD,
            httpOnly: true,
            sameSite: IS_PROD ? "none" : "lax",
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);
app.use(`/api/${SERVER_VERSION}`, router);
app.use(errorHandler);

app.use("/.well-known/webauthn", (req, res) => {
    const origins = {
        origins: [ORIGIN, CLIENT_URL],
    };
    return res.json(origins);
});

await init();

app.on("close", async () => {
    await close();
});

const server = app.listen(PORT, async () => {
    console.log(`\nServer is running on port ${PORT}`);
});

const wss = WebSocketInit(server);

process.once("SIGINT", () => {
    app.emit("close");
});

process.once("SIGTERM", () => {
    app.emit("close");
});

import express from "express";
import { api } from "../api/index.js";
import { verify } from "../middlewares/verify.js";
import { discordCallback, googleCallback } from "../middlewares/thirdPartyAuthentication.js";

const authRouter = express.Router();

// Default authentication
authRouter.post("/login", api.auth.login);
authRouter.post("/register", api.auth.register);
authRouter.post("/verify", verify(), api.auth.verify);
authRouter.post("/logout", verify(), api.auth.logout);

authRouter.post("/reset-password", api.auth.resetPassword);
authRouter.post("/forgot-password", api.auth.forgotPassword);

// Third party authentication
authRouter.get("/google", api.auth.google);
authRouter.get("/google/callback", googleCallback, api.auth.thirdPartyCallback);

authRouter.get("/discord", api.auth.discord);
authRouter.get("/discord/callback", discordCallback, api.auth.thirdPartyCallback);

// Passkey authentication
authRouter.post("/passkey/login", api.auth.loginWithPasskey);
authRouter.post("/passkey/login/options", api.auth.createLoginWithPasskeyOptions);

authRouter.post("/passkey", verify(), api.auth.createPasskey);
authRouter.post("/passkey/options", verify(), api.auth.createPasskeyOptions);

authRouter.get("/passkey", verify(), api.auth.getPasskeys);
authRouter.put("/passkey/:id", verify(), api.auth.updatePasskey);
authRouter.delete("/passkey/:id", verify(), api.auth.deletePasskey);

// Fingerprint
authRouter.post("/fp/ticket", api.auth.loginWithTicket);
authRouter.post("/fp", verify(), api.auth.validateFingerprint);
authRouter.post("/fp/accept", verify(), api.auth.acceptFingerprint);
authRouter.post("/fp/decline", verify(), api.auth.declineFingerprint);

export default authRouter;

import type { IUser } from "./interfaces/database/user.js";

declare global {
    namespace Express {
        interface Request {
            ctx: {
                user: Omit<IUser, "password">;
            };
        }
    }
}

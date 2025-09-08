declare global {
    namespace Express {
        interface Request {
            ctx: {
                // user: IUser;
            };
        }
    }
}

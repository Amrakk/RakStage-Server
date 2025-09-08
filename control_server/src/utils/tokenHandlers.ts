import jwt from "jsonwebtoken";
import { ObjectId } from "mongooat";
import redis from "../database/redis.js";
import { IS_PROD, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../constants.js";

import type { Response } from "express";
import type ITokenPayload from "../interfaces/api/token.js";

export async function setAccToken(id: ObjectId, res: Response) {
    const token = await new Promise<string>((res, rej) =>
        jwt.sign(
            { id },
            ACCESS_TOKEN_SECRET,
            {
                expiresIn: "15m",
            },
            (err, jwt) => {
                if (err) rej(err);
                res(jwt!);
            }
        )
    );

    res.cookie("accToken", token, {
        secure: IS_PROD,
        httpOnly: true,
        sameSite: IS_PROD ? "none" : "lax",
    });

    return token;
}

export async function setRefToken(id: ObjectId, res: Response) {
    const token = await new Promise<string>((res, rej) =>
        jwt.sign(
            { id },
            REFRESH_TOKEN_SECRET,
            {
                expiresIn: "7d",
            },
            (err, jwt) => {
                if (err) rej(err);
                res(jwt!);
            }
        )
    );

    res.cookie("refToken", token, {
        secure: IS_PROD,
        httpOnly: true,
        sameSite: IS_PROD ? "none" : "lax",
    });

    const signature = token.split(".").pop();

    const cache = redis.getRedis();
    await cache.set(`refToken-${id}-${signature}`, token, "EX", 60 * 60 * 24 * 7);

    return token;
}

export function verifyToken(token: string, secret = "") {
    try {
        const decoded = jwt.verify(token, secret);
        return decoded as ITokenPayload;
    } catch (err: jwt.VerifyErrors | any) {
        if (!(err instanceof jwt.TokenExpiredError)) return null;
        return "expired";
    }
}

export async function deleteRefToken(id: ObjectId) {
    const cache = redis.getRedis();
    await cache.del(`refToken-${id}`);

    return true;
}

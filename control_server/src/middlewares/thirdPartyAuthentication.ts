import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import UserService from "../services/internal/user.js";
import {
    ORIGIN,
    CLIENT_URL,
    DISCORD_ORIGIN,
    GOOGLE_CLIENT_ID,
    DISCORD_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    DISCORD_CLIENT_SECRET,
    SOCIAL_MEDIA_PROVIDER,
    GOOGLE_FAILURE_REDIRECT_PATH,
} from "../constants.js";

import ServiceResponseError from "../errors/ServiceResponseError.js";

import type { IUser } from "../interfaces/database/user.js";
import type { Request, Response, NextFunction } from "express";

const callbackURL = (provider: SOCIAL_MEDIA_PROVIDER) => `${ORIGIN}/api/v1/auth/${provider}/callback`;
const failureRedirect = (provider: SOCIAL_MEDIA_PROVIDER) =>
    `${CLIENT_URL}${GOOGLE_FAILURE_REDIRECT_PATH}?failed=true&provider=${provider}`;

const googleStrategy = new Strategy(
    {
        callbackURL: callbackURL(SOCIAL_MEDIA_PROVIDER.GOOGLE),
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            const { id, displayName } = profile;
            const { email, picture } = profile._json;

            const { password, ...rest } = await processUserData(SOCIAL_MEDIA_PROVIDER.GOOGLE, id, {
                email: email!,
                name: displayName,
                avatarUrl: picture,
            });

            done(null, rest);
        } catch (error) {
            done(error);
        }
    }
);

passport.use(googleStrategy);
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user as IUser);
});

export const googleRedirect = passport.authenticate("google", { scope: ["profile", "email"] });
export const googleCallback = passport.authenticate("google", {
    failureRedirect: failureRedirect(SOCIAL_MEDIA_PROVIDER.GOOGLE),
});

export const discordRedirect = (res: Response) => {
    const redirectURL = callbackURL(SOCIAL_MEDIA_PROVIDER.DISCORD);
    const navigateURL = new URL(`${DISCORD_ORIGIN}/oauth2/authorize`);

    navigateURL.searchParams.append("client_id", DISCORD_CLIENT_ID);
    navigateURL.searchParams.append("response_type", "code");
    navigateURL.searchParams.append("redirect_uri", redirectURL);
    navigateURL.searchParams.append("scope", "identify email");

    return res.redirect(`${navigateURL}`);
};

export const discordCallback = async (
    req: Request<{}, {}, {}, { code: string }>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { code } = req.query;

        const params = new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            code: code,
            redirect_uri: callbackURL(SOCIAL_MEDIA_PROVIDER.DISCORD),
            grant_type: "authorization_code",
        });

        const tokenResponse = await fetch(`${DISCORD_ORIGIN}/api/v10/oauth2/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `${params}`,
        }).then(async (discordRes) => {
            if (!discordRes.ok) {
                res.redirect(failureRedirect(SOCIAL_MEDIA_PROVIDER.DISCORD));
                const contentType = discordRes.headers.get("Content-Type");
                const body = await (contentType?.includes("application/json") ? discordRes.json() : discordRes.text());

                throw new ServiceResponseError("Discord", "Login with Discord", "Failed to get token", {
                    body,
                    headers: discordRes.headers,
                });
            }

            return discordRes.json();
        });

        const userResponse = await fetch(`${DISCORD_ORIGIN}/api/v10/users/@me`, {
            headers: {
                Authorization: `Bearer ${tokenResponse.access_token}`,
            },
        }).then(async (discordRes) => {
            if (!discordRes.ok) {
                res.redirect(failureRedirect(SOCIAL_MEDIA_PROVIDER.DISCORD));
                const contentType = discordRes.headers.get("Content-Type");
                const body = await (contentType?.includes("application/json") ? discordRes.json() : discordRes.text());

                throw new ServiceResponseError("Discord", "Login with Discord", "Failed to get user data", {
                    body,
                    headers: discordRes.headers,
                });
            }

            return discordRes.json();
        });

        const { id, username, avatar, email } = userResponse;
        const { password, ...rest } = await processUserData(SOCIAL_MEDIA_PROVIDER.DISCORD, id, {
            email,
            name: username,
            avatarUrl: `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`,
        });

        req.user = rest;

        return next();
    } catch (err) {
        next(err);
    }
};

async function processUserData(
    provider: SOCIAL_MEDIA_PROVIDER,
    providerAccountId: string,
    userData: { email: string; name: string; avatarUrl?: string }
): Promise<IUser> {
    let user = await UserService.getByEmail(userData.email);

    if (!user) {
        user = (
            await UserService.insert([
                {
                    ...userData,
                    socialMediaAccounts: [{ provider, accountId: providerAccountId }],
                },
            ])
        )[0];
    } else if (!user.socialMediaAccounts.find((account) => account.provider === provider)) {
        user = await UserService.updateSocialMediaAccounts(user._id, {
            provider,
            accountId: providerAccountId,
        });
    }

    return user;
}

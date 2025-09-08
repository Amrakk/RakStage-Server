import { z } from "zod";
import crypto from "crypto";
import mongooat from "../db.js";
import { hashPassword } from "../../utils/hashPassword.js";
import { toLowerNonAccentVietnamese } from "../../utils/removeDiacritics.js";
import { DEFAULT_AVATAR_URL, SOCIAL_MEDIA_PROVIDER, USER_ROLE, USER_STATUS } from "../../constants.js";

export const userRoleSchema = z.nativeEnum(USER_ROLE);
export const userStatusSchema = z.nativeEnum(USER_STATUS);
export const socialMediaProviderSchema = z.nativeEnum(SOCIAL_MEDIA_PROVIDER);

export const socialMediaAccountSchema = z.object({
    provider: socialMediaProviderSchema,
    accountId: z.string(),
});

const userSchema = z.object({
    name: z.string().transform((val) => val.trim()),
    _name: z.string().transform((val) => toLowerNonAccentVietnamese(val.trim())),
    email: z.string().email(),
    password: z
        .string()
        .min(6)
        .default(() => crypto.randomUUID().toString())
        .transform(async (val) => await hashPassword(val)),
    phoneNumber: z
        .string()
        .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g)
        .optional(),
    avatarUrl: z.string().default(DEFAULT_AVATAR_URL),
    role: userRoleSchema.default(USER_ROLE.USER),
    status: userStatusSchema.default(USER_STATUS.ACTIVE),
    socialMediaAccounts: z.array(socialMediaAccountSchema).default([]),
    createdAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .default(() => new Date()),
    updatedAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .default(() => new Date()),
    deletedAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date().nullable())
        .default(null),
});

export const UserModel = mongooat.Model("User", userSchema);

await UserModel.dropIndexes();
await UserModel.createIndex({ email: 1, deletedAt: 1 }, { unique: true });

import { z } from "zod";
import mongooat from "../db.js";
import { ZodObjectId } from "mongooat";
import { toLowerNonAccentVietnamese } from "../../utils/removeDiacritics.js";
import { PASSKEY_TRANSPORT } from "../../constants.js";

const transportsSchema = z.nativeEnum(PASSKEY_TRANSPORT);

const passkeySchema = z.object({
    name: z.string().transform((val) => toLowerNonAccentVietnamese(val.trim())),
    userId: ZodObjectId,
    counter: z.number().default(0),
    credentialId: z.string(),
    publicKey: z.string(),
    transports: z.array(transportsSchema),
    lastUsedAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date().nullable())
        .default(null),
    createdAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .default(() => new Date()),
    updatedAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .default(() => new Date()),
});

export const PasskeyModel = mongooat.Model("Passkey", passkeySchema);

await PasskeyModel.dropIndexes();
PasskeyModel.createIndex({ userId: 1, credentialId: 1 }, { unique: true });

import { z } from "zod";
import mongooat from "../db.js";
import { ZodObjectId } from "mongooat";
import { STAGE_STATUS } from "../../constants.js";

import type { StageCode } from "../../interfaces/database/stage.js";

export const stageStatusSchema = z.nativeEnum(STAGE_STATUS);

export const codeSchema = z.custom<StageCode>(
    (val) => {
        if (typeof val !== "string") return false;
        else if (!/^[a-z-]+$/.test(val)) return false;
        else if (val.split("-").length !== 3) return false;

        return true;
    },
    { message: "Invalid stage code" }
);

const stageSchema = z.object({
    code: codeSchema,
    title: z.string().transform((val) => val.trim()),
    hostId: ZodObjectId,
    serverHost: z.string(),
    status: stageStatusSchema.default(STAGE_STATUS.LIVE),
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

export const StageModel = mongooat.Model("Stage", stageSchema);

await StageModel.dropIndexes();
await StageModel.createIndex({ status: 1 });
await StageModel.createIndex({ code: 1, deletedAt: 1 }, { unique: true });
await StageModel.createIndex({ hostId: 1, deletedAt: 1 }, { unique: true });

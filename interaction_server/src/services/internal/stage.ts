import { ZodObjectId } from "mongooat";
import { StageModel } from "../../database/models/stage.js";
import { MAX_CODE_GENERATE_ATTEMPTS } from "../../constants.js";

import ServiceResponseError from "../../errors/ServiceResponseError.js";

import type { ObjectId } from "mongodb";
import type { IReqStage } from "../../interfaces/api/request.js";
import type { IStage, StageCode } from "../../interfaces/database/stage.js";

export default class StageService {
    private static async generateCode(): Promise<StageCode> {
        const letters = "abcdefghijklmnopqrstuvwxyz";

        for (let i = 0; i < MAX_CODE_GENERATE_ATTEMPTS; i++) {
            const code = [...Array(3)]
                .map(() =>
                    Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join("")
                )
                .join("-") as StageCode;

            const exists = (await StageModel.countDocuments({ code, deletedAt: null })) !== 0;
            if (exists) continue;

            return code;
        }

        throw new ServiceResponseError("StageService", "generateCode", "Failed to generate code");
    }

    // Query
    public static async getById(id: string | ObjectId): Promise<IStage | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) return null;

        return StageModel.findOne({ _id: result.data, deletedAt: null });
    }

    public static async getByCode(code: StageCode): Promise<IStage | null> {
        return StageModel.findOne({ code, deletedAt: null });
    }

    // Mutation
    public static async insert(stage: IReqStage.Insert): Promise<IStage> {
        const code = await this.generateCode();
        return StageModel.insertOne({ ...stage, code });
    }

    public static async updateById(id: string | ObjectId, stage: IStage): Promise<IStage | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) return null;

        const updateData = {
            ...stage,
            updatedAt: new Date(),
        };

        return StageModel.findOneAndUpdate({ _id: result.data, deletedAt: null }, updateData, {
            returnDocument: "after",
        });
    }

    public static async deleteById(id: string | ObjectId): Promise<IStage | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) return null;

        return StageModel.findOneAndUpdate(
            { _id: result.data, deletedAt: null },
            { deletedAt: new Date() },
            { returnDocument: "after" }
        );
    }
}

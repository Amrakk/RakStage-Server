import { ObjectId, ZodObjectId } from "mongooat";
import { PasskeyModel } from "../../database/models/passkey.js";

import NotFoundError from "../../errors/NotFoundError.js";

import type { ClientSession } from "mongodb";
import type { IReqPasskey } from "../../interfaces/api/request.js";
import type { IResPasskey } from "../../interfaces/api/response.js";
import type { IPasskey } from "../../interfaces/database/passkey.js";

export default class PasskeyService {
    // Query
    public static async getByCredentialId(credentialId: string): Promise<IPasskey | null> {
        return PasskeyModel.findOne({ credentialId });
    }

    public static async getByUserId(userId: ObjectId | string): Promise<IPasskey[]> {
        const result = await ZodObjectId.safeParseAsync(userId);
        if (result.error) throw new NotFoundError("User not found");

        return PasskeyModel.find({ userId: result.data });
    }

    // Mutation
    public static async insert(passkeys: IReqPasskey.Insert[]): Promise<IResPasskey.Base[]> {
        const insertedPasskeys = await PasskeyModel.insertMany(passkeys);
        return insertedPasskeys.map(({ credentialId, publicKey, ...rest }) => rest);
    }

    public static async updateById(
        id: string | ObjectId,
        data: IReqPasskey.Update,
        options?: { session?: ClientSession }
    ): Promise<IResPasskey.Base> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("Passkey not found");

        const updateData = { ...data, updatedAt: new Date() };

        const passkey = await PasskeyModel.findByIdAndUpdate(result.data, updateData, {
            returnDocument: "after",
            session: options?.session,
            projection: { credentialId: 0, publicKey: 0 },
        });
        if (!passkey) throw new NotFoundError("Passkey not found");

        return passkey;
    }

    public static async updateByCredentialId(
        credentialId: string,
        data: IReqPasskey.Update
    ): Promise<IResPasskey.Base> {
        const updateData = { ...data, updatedAt: new Date() };

        const passkey = await PasskeyModel.findOneAndUpdate({ credentialId }, updateData, {
            returnDocument: "after",
            projection: { credentialId: 0, publicKey: 0 },
        });
        if (!passkey) throw new NotFoundError("Passkey not found");

        return passkey;
    }

    public static async deleteById(
        id: ObjectId | string,
        options?: { session?: ClientSession }
    ): Promise<IResPasskey.Base> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("Passkey not found");

        const passkey = await PasskeyModel.findByIdAndDelete(result.data, {
            session: options?.session,
            projection: { credentialId: 0, publicKey: 0 },
        });
        if (!passkey) throw new NotFoundError("Passkey not found");

        return passkey;
    }
}

import type { ObjectId } from "mongooat";
import type { PASSKEY_TRANSPORT } from "../../constants.js";

export interface IPasskey {
    _id: ObjectId;
    name: string;
    userId: ObjectId;
    credentialId: string;
    publicKey: string;
    counter: number;
    transports: PASSKEY_TRANSPORT[];
    lastUsedAt: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
}

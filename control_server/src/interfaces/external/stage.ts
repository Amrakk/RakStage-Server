import type { ObjectId } from "mongooat";
import type { STAGE_STATUS } from "../../constants.js";

export interface IStage {
    _id: ObjectId;
    code: `${string}-${string}-${string}`;
    title: string;
    hostId: ObjectId;
    serverHost: string;
    status: STAGE_STATUS;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

import type { ObjectId } from "mongooat";
import type { IStage } from "../external/stage.js";
import type BaseError from "../../errors/BaseError.js";
import type { IPasskey } from "../database/passkey.js";
import type { ISocialMediaAccount, IUser, IUserProfile } from "../database/user.js";
import type { RESPONSE_CODE, RESPONSE_MESSAGE, USER_ROLE, USER_STATUS } from "../../constants.js";

// CORE RESPONSE INTERFACE
export interface IResponse<T = undefined> {
    /** Response code */
    code: RESPONSE_CODE;
    /** Response message */
    message: RESPONSE_MESSAGE;
    /** Response data */
    data?: T;
    /** Error details */
    error?: BaseError | Record<string, unknown> | Array<unknown>;
}

// API RESPONSE INTERFACES
export interface IResLogin {
    user: Omit<IUser, "password">;
}

export namespace IResUser {
    export interface GetAll {
        users: Omit<IUser, "password">[];
        totalDocuments: number;
    }

    export interface GetById {
        _id: ObjectId;
        name: string;
        email: string;
        phoneNumber?: string;
        role: USER_ROLE;
        status: USER_STATUS;
        avatarUrl: string;
        socialMediaAccounts: ISocialMediaAccount[];
    }

    export interface GetByEmailOrPhone extends IUserProfile {}
}

export namespace IResPasskey {
    export interface Base extends Omit<IPasskey, "publicKey" | "credentialId"> {}
}

export namespace IResInteractionServer {
    export interface JoinStage {
        stage: IStage;
        token: string;
    }
}

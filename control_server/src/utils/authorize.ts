import { USER_ROLE } from "../constants.js";

import type { IUser } from "../interfaces/database/user.js";
import type { IReqUser } from "../interfaces/api/request.js";

export function isAuthorizeToUpdateUser(
    requestUser: Omit<IUser, "password">,
    targetUserId: string,
    body: IReqUser.Update
): boolean {
    const isSelfUpdate = requestUser._id.toString() === targetUserId;

    if (requestUser.role !== USER_ROLE.ADMIN && !isSelfUpdate) return false;

    if (requestUser.role !== USER_ROLE.ADMIN) {
        const allowedUpdates = ["name", "avatarUrl", "phoneNumber", "socialMediaAccounts"];
        const updates = Object.keys(body);
        return updates.every((update) => allowedUpdates.includes(update));
    }

    return true;
}

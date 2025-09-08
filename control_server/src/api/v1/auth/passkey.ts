import ApiController from "../../apiController.js";
import AuthnService from "../../../services/external/authn.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE, USER_ROLE } from "../../../constants.js";
import { setAccToken, setRefToken } from "../../../utils/tokenHandlers.js";

import type { IReqAuth } from "../../../interfaces/api/request.js";
import type { IResPasskey } from "../../../interfaces/api/response.js";
import PasskeyService from "../../../services/internal/passkey.js";
import mongooat from "../../../database/db.js";
import ForbiddenError from "../../../errors/ForbiddenError.js";

export const createPasskey = ApiController.callbackFactory<{}, { body: IReqAuth.CreatePassKey }, IResPasskey.Base>(
    async (req, res, next) => {
        try {
            const { credential } = req.body;
            const { _id, name } = req.ctx.user;

            const [passkey] = await AuthnService.verifyRegister(_id, name, credential);

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: passkey,
            });
        } catch (err) {
            next(err);
        }
    }
);

export const createPasskeyOptions = ApiController.callbackFactory<{}, {}, PublicKeyCredentialCreationOptionsJSON>(
    async (req, res, next) => {
        try {
            const { _id, email, name } = req.ctx.user;

            const options = await AuthnService.createRegisterOptions({ _id, email, name });

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: options,
            });
        } catch (err) {
            next(err);
        }
    }
);

export const loginWithPasskey = ApiController.callbackFactory<{}, { body: IReqAuth.LoginWithPasskey }, {}>(
    async (req, res, next) => {
        try {
            const { credential } = req.body;

            const result = await AuthnService.loginWithPasskey(credential);

            await Promise.all([setAccToken(result.userId, res), setRefToken(result.userId, res)]);

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: result,
            });
        } catch (err) {
            next(err);
        }
    }
);

export const createLoginWithPasskeyOptions = ApiController.callbackFactory<
    {},
    { body: { userId: string } },
    PublicKeyCredentialRequestOptionsJSON
>(async (req, res, next) => {
    try {
        const { userId } = req.body;

        const options = await AuthnService.createLoginOptions(userId);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: options,
        });
    } catch (err) {
        next(err);
    }
});

export const getPasskeys = ApiController.callbackFactory<{}, {}, IResPasskey.Base[]>(async (req, res, next) => {
    try {
        const { _id } = req.ctx.user;

        const passkeys = await PasskeyService.getByUserId(_id);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: passkeys,
        });
    } catch (err) {
        next(err);
    }
});

export const updatePasskey = ApiController.callbackFactory<
    { id: string },
    { body: { name: string } },
    IResPasskey.Base
>(async (req, res, next) => {
    const session = mongooat.getBase().startSession();
    try {
        const { id } = req.params;
        const { name } = req.body;
        const { _id: userId, role } = req.ctx.user;

        return await session.withTransaction(async () => {
            const passkey = await PasskeyService.updateById(id, { name });

            if (role !== USER_ROLE.ADMIN && passkey.userId !== userId)
                throw new ForbiddenError("You are not allowed to update this passkey");

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: passkey,
            });
        });
    } catch (err) {
        next(err);
    } finally {
        session.endSession();
    }
});

export const deletePasskey = ApiController.callbackFactory<{ id: string }, {}, IResPasskey.Base>(
    async (req, res, next) => {
        const session = mongooat.getBase().startSession();
        try {
            const { id } = req.params;
            const { _id: userId, role } = req.ctx.user;

            return await session.withTransaction(async () => {
                const passkey = await PasskeyService.deleteById(id, { session });

                if (role !== USER_ROLE.ADMIN && passkey.userId !== userId)
                    throw new ForbiddenError("You are not allowed to delete this passkey");

                return res.status(200).json({
                    code: RESPONSE_CODE.SUCCESS,
                    message: RESPONSE_MESSAGE.SUCCESS,
                    data: passkey,
                });
            });
        } catch (err) {
            next(err);
        } finally {
            session.endSession();
        }
    }
);

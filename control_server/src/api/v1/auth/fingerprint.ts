import ApiController from "../../apiController.js";
import { FINGERPRINT_ACTIONS, RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import { FingerprintService } from "../../../services/internal/fingerprint.js";
import type { IResLogin } from "../../../interfaces/api/response.js";
import { setAccToken, setRefToken } from "../../../utils/tokenHandlers.js";

export const validateFingerprint = ApiController.callbackFactory<
    {},
    { body: { fingerprint: string } },
    { validated: boolean }
>(async (req, res, next) => {
    try {
        const { fingerprint } = req.body;
        const { _id, name, avatarUrl } = req.ctx.user;

        const validated = await FingerprintService.validateFingerprint(fingerprint, { _id, name, avatarUrl });

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: { validated },
        });
    } catch (err) {
        next(err);
    }
});

export const acceptFingerprint = ApiController.callbackFactory<{}, { body: { fingerprint: string } }, {}>(
    async (req, res, next) => {
        try {
            const { _id } = req.ctx.user;
            const { fingerprint } = req.body;

            const result = await FingerprintService.fingerprintAction(fingerprint, _id, FINGERPRINT_ACTIONS.ACCEPT);

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: { result },
            });
        } catch (err) {
            next(err);
        }
    }
);

export const declineFingerprint = ApiController.callbackFactory<
    {},
    { body: { fingerprint: string } },
    { result: boolean }
>(async (req, res, next) => {
    try {
        const { _id } = req.ctx.user;
        const { fingerprint } = req.body;

        const result = await FingerprintService.fingerprintAction(fingerprint, _id, FINGERPRINT_ACTIONS.DECLINE);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: { result },
        });
    } catch (err) {
        next(err);
    }
});

export const loginWithTicket = ApiController.callbackFactory<{}, { body: { ticket: string } }, IResLogin>(
    async (req, res, next) => {
        try {
            const { ticket } = req.body;

            const user = await FingerprintService.loginWithTicket(ticket);

            await Promise.all([setAccToken(user._id, res), setRefToken(user._id, res)]);

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: { user },
            });
        } catch (err) {
            next(err);
        }
    }
);

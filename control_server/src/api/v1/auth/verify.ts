import ApiController from "../../apiController.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import { setAccToken, setRefToken } from "../../../utils/tokenHandlers.js";

import type { IResLogin } from "../../../interfaces/api/response.js";

export const verify = ApiController.callbackFactory<{}, {}, IResLogin>(async (req, res, next) => {
    try {
        const { user } = req.ctx;

        await Promise.all([setAccToken(user._id, res), setRefToken(user._id, res)]);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: { user },
        });
    } catch (err) {
        next(err);
    }
});

import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import { setAccToken, setRefToken } from "../../../utils/tokenHandlers.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { IReqAuth } from "../../../interfaces/api/request.js";
import type { IResLogin } from "../../../interfaces/api/response.js";

export const register = ApiController.callbackFactory<{}, { body: IReqAuth.Register }, IResLogin>(
    async (req, res, next) => {
        try {
            const user = await UserService.register(req.body);

            await Promise.all([setAccToken(user._id, res), setRefToken(user._id, res)]);

            return res.status(201).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: { user },
            });
        } catch (err) {
            next(err);
        }
    }
);

import ApiController from "../../apiController.js";
import InteractionService from "../../../services/external/stage.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import type { IResInteractionServer } from "../../../interfaces/api/response.js";
import type { IReqInteractionServer } from "../../../interfaces/api/request.js";

export const createStage = ApiController.callbackFactory<
    {},
    { body: IReqInteractionServer.CreateStage },
    IResInteractionServer.JoinStage
>(async (req, res, next) => {
    try {
        const { title } = req.body;
        const { _id, name } = req.ctx.user;

        const stage = await InteractionService.createStage(_id, title || `${name}'s Stage`);

        return res.status(201).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: stage });
    } catch (err) {
        next(err);
    }
});

export const joinStage = ApiController.callbackFactory<{ code: string }, {}, IResInteractionServer.JoinStage>(
    async (req, res, next) => {
        try {
            const { code } = req.params;
            const { _id } = req.ctx.user;

            const stage = await InteractionService.joinStage(_id, code);

            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: stage });
        } catch (err) {
            next(err);
        }
    }
);

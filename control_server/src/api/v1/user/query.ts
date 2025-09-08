import { z } from "zod";
import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE, USER_ROLE, USER_STATUS } from "../../../constants.js";

import { ValidateError } from "mongooat";
import NotFoundError from "../../../errors/NotFoundError.js";
import ForbiddenError from "../../../errors/ForbiddenError.js";

import type { IReqUser } from "../../../interfaces/api/request.js";
import type { IResUser } from "../../../interfaces/api/response.js";

const querySchema = z
    .object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),

        searchTerm: z.string().optional(),
        role: z.preprocess((value) => (value ? [value].flat() : value), z.array(z.nativeEnum(USER_ROLE)).optional()),
        status: z.preprocess(
            (value) => (value ? [value].flat() : value),
            z.array(z.nativeEnum(USER_STATUS)).optional()
        ),
    })
    .strict()
    .refine(
        (data) => {
            if (!data.limit && data.page) return false;
            return true;
        },
        { message: "'limit' must be provided if 'page' is provided", path: ["limit"] }
    );

export const getAll = ApiController.callbackFactory<{}, { query: IReqUser.GetAllQuery }, IResUser.GetAll>(
    async (req, res, next) => {
        try {
            const { query } = req;

            const validatedQuery = await querySchema.safeParseAsync(query);
            if (!validatedQuery.success)
                throw new ValidateError("Invalid query parameters", validatedQuery.error.errors);

            const [users, totalDocuments] = await UserService.getAll(validatedQuery.data);
            const returnUser = users.map(({ password, ...rest }) => rest);

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: { users: returnUser, totalDocuments },
            });
        } catch (err) {
            next(err);
        }
    }
);

export const getById = ApiController.callbackFactory<{ id: string }, {}, IResUser.GetById>(async (req, res, next) => {
    try {
        const { id } = req.params;
        const requestUser = req.ctx.user;

        if (requestUser.role !== USER_ROLE.ADMIN && requestUser._id.toString() !== id) throw new ForbiddenError();

        const user = await UserService.getById(id);
        if (!user) throw new NotFoundError("User not found");

        const { password, ...rest } = user;

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: rest,
        });
    } catch (err) {
        next(err);
    }
});

export const getByEmailOrPhone = ApiController.callbackFactory<
    {},
    { query: { emailOrPhone: string } },
    IResUser.GetByEmailOrPhone
>(async (req, res, next) => {
    try {
        const { emailOrPhone } = req.query;
        const requestUser = req.ctx.user;

        const user = await UserService.getByEmailOrPhone(requestUser._id, emailOrPhone);
        if (!user) throw new NotFoundError("User not found");

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: user,
        });
    } catch (err) {
        next(err);
    }
});

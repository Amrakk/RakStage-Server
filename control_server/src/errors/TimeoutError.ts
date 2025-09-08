import BaseError from "./BaseError.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

import type { IResponse } from "../interfaces/api/response.js";

export default class TimeoutError extends BaseError {
    statusCode = 408;
    details: Record<string, unknown>;

    constructor(message: string, details?: Record<string, unknown>) {
        super(message);
        this.details = details ?? {};
    }

    public getResponseBody(): IResponse {
        return {
            code: RESPONSE_CODE.TIMEOUT,
            message: RESPONSE_MESSAGE.TIMEOUT,
            error: {
                message: this.message,
                details: this.details,
            },
        };
    }
}

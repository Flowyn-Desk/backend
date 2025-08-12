import { StatusCodes } from "http-status-codes";
import { BaseError } from "./BaseError.js";

export class ForbiddenError extends BaseError {
    constructor(message: string = 'Access forbidden') {
        super(message, StatusCodes.FORBIDDEN);
        this.name = 'ForbiddenError';
    }
}
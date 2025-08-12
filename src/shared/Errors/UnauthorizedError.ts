import { StatusCodes } from "http-status-codes";
import { BaseError } from "./BaseError.js";

export class UnauthorizedError extends BaseError {
    constructor(message: string = 'Unauthorized access') {
        super(message, StatusCodes.UNAUTHORIZED);
        this.name = 'UnauthorizedError';
    }
}

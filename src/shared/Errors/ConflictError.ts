import { StatusCodes } from "http-status-codes";
import { BaseError } from "./BaseError.js";

export class ConflictError extends BaseError {
    constructor(message: string = 'Resource conflict') {
        super(message, StatusCodes.CONFLICT);
        this.name = 'ConflictError';
    }
}
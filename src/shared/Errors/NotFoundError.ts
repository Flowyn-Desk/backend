import { StatusCodes } from "http-status-codes";
import { BaseError } from "./BaseError.js";

export class NotFoundError extends BaseError {
    constructor(message: string = 'Resource not found') {
        super(message, StatusCodes.NOT_FOUND);
        this.name = 'NotFoundError';
    }
}
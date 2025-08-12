import { StatusCodes } from "http-status-codes";
import { BaseError } from "./BaseError";

export class BadRequestError extends BaseError {
    constructor(message: string = 'Bad request') {
        super(message, StatusCodes.BAD_REQUEST);
        this.name = 'BadRequestError';
    }
}
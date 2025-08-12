import { StatusCodes } from "http-status-codes";
import {BaseError} from "./BaseError"

export class ValidationError extends BaseError {
    constructor(message?: string) {
        super(message, StatusCodes.BAD_REQUEST);
        this.name = 'ValidationError';
    }
}
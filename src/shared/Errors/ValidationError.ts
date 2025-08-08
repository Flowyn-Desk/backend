import { StatusCodes } from "http-status-codes";
import {BaseError} from "./BaseError.js"

export class ValidationError extends BaseError {
    constructor(message?: string) {
        super(message, StatusCodes.BAD_REQUEST);
    }
}
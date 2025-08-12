import { StatusCodes } from "http-status-codes";
import { BaseError } from "./BaseError.js";

export class ExpectationError extends BaseError {
    constructor(message: string = '') {
        super(message, StatusCodes.EXPECTATION_FAILED);
        this.name = 'ExpectationError';
    }
}
import {StatusCodes, getReasonPhrase} from 'http-status-codes'

export class BaseError extends Error {
    public readonly httpStatus: StatusCodes;
    public readonly reasonPhrase: string;

    constructor(message?: string, httpStatus: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR){
        super(message ?? getReasonPhrase(httpStatus));
        Object.setPrototypeOf(this, BaseError.prototype)
        this.name = this.constructor.name;
        this.httpStatus = httpStatus;
        this.reasonPhrase = getReasonPhrase(this.httpStatus);
    }
}
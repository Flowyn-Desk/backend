import type { StatusCodes } from "http-status-codes";

export class ServiceResponse<T> {

    httpStatusCode: StatusCodes;
    payload: T;
    message: string;

    constructor(
        httpsStatusCode: StatusCodes,
        payload: T,
        message: string
    ) {
        this.httpStatusCode = httpsStatusCode;
        this.payload = payload;
        this.message = message;
    }
}

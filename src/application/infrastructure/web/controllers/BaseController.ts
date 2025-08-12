import type { Response } from 'express';
import { ServiceResponse } from '../../../../domain/services/ServiceResponse';

export abstract class BaseController {
  protected handleResponse<T>(res: Response<any, Record<string, any>>, serviceResponse: ServiceResponse<T>): void {
    res.status(serviceResponse.httpStatusCode).json({
      message: serviceResponse.message,
      data: serviceResponse.payload
    });
  }
}
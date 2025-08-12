import type { Response } from 'express';
import { ServiceResponse } from '../../../../domain/services/ServiceResponse';
import { Logger } from '../../../../shared/Logger';

export abstract class BaseController {

  protected readonly logger: Logger;

  constructor(controllerName: string){
    this.logger = new Logger(controllerName);
  }

  protected handleResponse<T>(res: Response<any, Record<string, any>>, serviceResponse: ServiceResponse<T>): void {
    res.status(serviceResponse.httpStatusCode).json({
      message: serviceResponse.message,
      data: serviceResponse.payload
    });
  }
}
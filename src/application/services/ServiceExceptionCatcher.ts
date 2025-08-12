import { StatusCodes } from 'http-status-codes';
import { Logger } from '../../shared/Logger';
import { ServiceResponse } from '../../domain/services/ServiceResponse';
import { BaseError } from '../../shared/Errors/BaseError';

export class ServiceExceptionCatcher {
    private readonly serviceName: string;
    private readonly logger: Logger;

    constructor(serviceName: string) {
        this.serviceName = serviceName;
        this.logger = new Logger(this.serviceName);
    }

    catch<T>(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        const originalMethod = descriptor.value;
        const logger = this.logger;
        const serviceName = this.serviceName;

        descriptor.value = async function (...args: any[]): Promise<ServiceResponse<T>> {
            try {
                return await originalMethod.apply(this, args);
            } catch (exception) {
                logger.logError(`Error in ${serviceName}.${propertyKey}: ${exception}`);
                logger.logDebug(`Exception details: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}`);

                const response = new ServiceResponse<T>(
                    ServiceExceptionCatcher.getStatus(exception),
                    null as any,
                    ServiceExceptionCatcher.getMessage(exception, logger)
                );

                return response;
            }
        };

        return descriptor;
    }

    wrapMethod<T extends any[], R>(
        method: (...args: T) => Promise<ServiceResponse<R>>,
        methodName: string
    ): (...args: T) => Promise<ServiceResponse<R>> {
        const logger = this.logger;
        const serviceName = this.serviceName;

        return async (...args: T): Promise<ServiceResponse<R>> => {
            try {
                return await method(...args);
            } catch (exception) {
                logger.logError(`Error in ${serviceName}.${methodName}: ${exception}`);
                logger.logDebug(`Exception details: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}`);

                return new ServiceResponse<R>(
                    ServiceExceptionCatcher.getStatus(exception),
                    null as any,
                    ServiceExceptionCatcher.getMessage(exception, logger)
                );
            }
        };
    }

    private static getStatus(exception: unknown): StatusCodes {
        if (exception instanceof BaseError) {
            return exception.httpStatus;
        }
        return StatusCodes.INTERNAL_SERVER_ERROR;
    }

    private static getMessage(exception: unknown, logger: Logger): string {
        let message: string = 'An unexpected error occurred';

        if (exception instanceof BaseError || exception instanceof Error) {
            message = exception.message;
        }
        logger.logWarning(`Service error: ${message}`);
        logger.logError(String(exception));
        return message;
    }
}

export function CatchServiceExceptions(catcher: ServiceExceptionCatcher) {
    return function <T>(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        return catcher.catch<T>(target, propertyKey, descriptor);
    };
}
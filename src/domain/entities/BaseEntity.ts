import { v4 as uuidv4 } from 'uuid';
import { Type, plainToInstance, instanceToPlain } from 'class-transformer';
import { IsUUID, IsDate, IsOptional, IsBoolean, validateSync, ValidationError as ClassValidatorError } from 'class-validator';
import { ValidationError } from '../../shared/Errors/ValidationError';

export abstract class BaseEntity {
    @IsUUID()
    uuid: string;

    @Type(() => Date)
    @IsDate()
    createdAt: Date;

    @Type(() => Date)
    @IsDate()
    updatedAt: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    deletedAt?: Date | undefined;

    @IsBoolean()
    active: boolean;

    constructor(
        uuid?: string,
        createdAt?: Date,
        updatedAt?: Date,
        deletedAt?: Date | undefined,
        active?: boolean
    ) {
        this.uuid = uuid ?? uuidv4();
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? new Date();
        this.deletedAt = deletedAt;
        this.active = active ?? true;
    }

    /**
       * Marks the entity as deleted by setting `active` to false,
       * assigns the current date to `deletedAt`, and updates `updatedAt`.
       */
    delete() {
        this.active = false;
        this.deletedAt = new Date();
        this.markUpdated();
    }

    /**
       * Updates the `updatedAt` property with the current date and time.
       */
    markUpdated() {
        this.updatedAt = new Date();
    }

    /**
     * Converts class instance to a plain JS object suitable for JSON serialization.
     */
    toJson(): Record<string, unknown> {
        return instanceToPlain(this);
    }

    /**
     * Creates an instance of the class from a plain object (e.g., parsed JSON).
     */
    static fromJson<T extends BaseEntity>(
        this: new (...args: any[]) => T,
        json: object
    ): T {
        return plainToInstance(this, json, { enableImplicitConversion: true });
    }

    /**
   * Synchronously validates the entity.
   * Throws ValidationError if validation fails.
   */
    validate(): void {
        const errors = validateSync(this);

        if (errors.length === 0) {
            return;
        }

        const messages = errors
            .flatMap((err: ClassValidatorError) => err.constraints ? Object.values(err.constraints) : [])
            .join('; ');

        throw new ValidationError(messages || 'Validation failed');
    }

    protected parseDate(input: string | Date): Date | null {
        if (!input || input instanceof Date) {
            return input;
        }
        if (typeof input === 'string') {
            const parsed = new Date(input);
            if (isNaN(parsed.getTime())) {
                throw new Error(`Invalid date string: ${input}`);
            }
            return parsed;
        }
        throw new Error('Input must be a Date or an ISO date string');
    }
}
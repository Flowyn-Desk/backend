import type { BaseResponseDto } from "../../application/dto/BaseResponseDto";
import { StatusCodes } from 'http-status-codes';
import { BaseError } from "../../shared/Errors/BaseError";
import { ServiceExceptionCatcher } from "./ServiceExceptionCatcher";
import type { BaseEntity } from "../../domain/entities/BaseEntity";
import type { IBaseService } from "../../domain/services/IBaseService";
import type { IBaseRepository } from "../../domain/repositories/IBaseRepository";
import { ServiceResponse } from "../../domain/services/ServiceResponse";

export abstract class BaseService<
    TEntity extends BaseEntity,
    TRequestDTO,
    TResponseDTO extends BaseResponseDto,
    TRepository extends IBaseRepository<TEntity> = IBaseRepository<TEntity>
> implements IBaseService<TRequestDTO, TResponseDTO> {

    protected readonly exceptionCatcher: ServiceExceptionCatcher;

    protected constructor(
        protected readonly repository: TRepository,
        serviceName?: string
    ) {
        this.exceptionCatcher = new ServiceExceptionCatcher(serviceName || this.constructor.name);
        this.create = this.exceptionCatcher.wrapMethod(this.create.bind(this), 'create');
        this.getByUuid = this.exceptionCatcher.wrapMethod(this.getByUuid.bind(this), 'getByUuid');
        this.getAll = this.exceptionCatcher.wrapMethod(this.getAll.bind(this), 'getAll');
        this.update = this.exceptionCatcher.wrapMethod(this.update.bind(this), 'update');
        this.delete = this.exceptionCatcher.wrapMethod(this.delete.bind(this), 'delete');
    }

    protected abstract toResponseDto(entity: TEntity): TResponseDTO;
    protected abstract toEntity(request: TRequestDTO): TEntity;
    protected abstract updateEntity(entity: TEntity, updates: Partial<TRequestDTO>): TEntity;

    async create(request: TRequestDTO): Promise<ServiceResponse<TResponseDTO>> {
        const entity = this.toEntity(request);
        entity.validate();
        const createdEntity = await this.repository.create(entity);
        const responseDto = this.toResponseDto(createdEntity);
        
        return new ServiceResponse(
            StatusCodes.CREATED,
            responseDto,
            `Entity ${createdEntity.uuid} created successfully`
        );
    }

    async getByUuid(uuid: string): Promise<ServiceResponse<TResponseDTO>> {
        if (!this.isValidUuid(uuid)) {
            throw new BaseError('Invalid UUID format', StatusCodes.BAD_REQUEST);
        }
        const entity = await this.repository.findByUuid(uuid);

        const responseDto = this.toResponseDto(entity);
        return new ServiceResponse(
            StatusCodes.OK,
            responseDto,
            'Entity retrieved successfully'
        );
    }

    async getAll(): Promise<ServiceResponse<TResponseDTO[]>> {
        const entities = await this.repository.findAll();
        const responseDtos = entities
            .filter(entity => entity.active)
            .map(entity => this.toResponseDto(entity));

        return new ServiceResponse(
            StatusCodes.OK,
            responseDtos,
            `Retrieved ${responseDtos.length} entities successfully`
        );
    }

    async update(uuid: string, updates: Partial<TRequestDTO>): Promise<ServiceResponse<TResponseDTO>> {
        if (!this.isValidUuid(uuid)) {
            throw new BaseError('Invalid UUID format', StatusCodes.BAD_REQUEST);
        }

        const existingEntity = await this.repository.findByUuid(uuid);
        if (!existingEntity || !existingEntity.active) {
            throw new BaseError('Entity not found or has been deleted', StatusCodes.NOT_FOUND);
        }

        const updatedEntity = this.updateEntity(existingEntity, updates);
        updatedEntity.markUpdated();
        updatedEntity.validate();

        const savedEntity = await this.repository.update(uuid, updatedEntity);
        const responseDto = this.toResponseDto(savedEntity);
        
        return new ServiceResponse(
            StatusCodes.OK,
            responseDto,
            `Entity ${uuid} updated successfully`
        );
    }

    async delete(uuid: string): Promise<ServiceResponse<TResponseDTO>> {
        if (!this.isValidUuid(uuid)) {
            throw new BaseError('Invalid UUID format', StatusCodes.BAD_REQUEST);
        }

        const existingEntity = await this.repository.findByUuid(uuid);
        if (!existingEntity || !existingEntity.active) {
            throw new BaseError('Entity not found or already deleted', StatusCodes.NOT_FOUND);
        }

        existingEntity.delete();
        const deletedEntity = await this.repository.update(uuid, existingEntity);
        const responseDto = this.toResponseDto(deletedEntity);
        
        return new ServiceResponse(
            StatusCodes.OK,
            responseDto,
            `Entity ${uuid} deleted successfully`
        );
    }

    protected isValidUuid(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }

    protected parseDate(input: string | Date): Date {
        if (input instanceof Date) {
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
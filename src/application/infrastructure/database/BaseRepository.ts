import type { PrismaClient } from "../../../../generated/prisma/client";
import type { BaseEntity } from "../../../domain/entities/BaseEntity";
import type { IBaseRepository } from "../../../domain/repositories/IBaseRepository";
import { NotFoundError } from "../../../shared/Errors/NotFoundError";

export abstract class BaseRepository<T extends BaseEntity> implements IBaseRepository<T> {
    protected readonly prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(entity: T): Promise<T> {
        const data = entity.toJson();
        const modelName = this.getModelName();
        // @ts-ignore: Prisma dynamic model access
        const created = await this.prisma[modelName].create({
            data,
        });
        return this.mapToEntity(created);
    }

    async findByUuid(uuid: string): Promise<T> {
        const modelName = this.getModelName();
        // @ts-ignore
        const record = await this.prisma[modelName].findFirst({
            where: { uuid, active: true },
        });
        if (!record){
            throw new NotFoundError(`The entity ${uuid} was not found`)
        }
        return this.mapToEntity(record);
    }

    async findAll(): Promise<T[]> {
        const modelName = this.getModelName();
        // @ts-ignore
        const records: Array<any> = await this.prisma[modelName].findMany({
            where: { active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async update(uuid: string, entity: Partial<T>): Promise<T> {
        const data = entity.toJson ? entity.toJson() : entity;
        const modelName = this.getModelName();
        // @ts-ignore
        const updated = await this.prisma[modelName].update({
            where: { uuid },
            data,
        });
        return this.mapToEntity(updated);
    }

    protected abstract getModelName(): string;

    protected abstract mapToEntity(record: any): T;

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
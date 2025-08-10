export interface IBaseRepository<T> {
    create(entity: T): Promise<T>;
    findByUuid(uuid: string): Promise<T | null>;
    findAll(): Promise<T[]>;
    update(uuid: string, entity: Partial<T>): Promise<T>;
}
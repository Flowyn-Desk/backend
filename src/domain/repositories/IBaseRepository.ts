export interface IBaseRepository<T> {
    create(entity: T): Promise<T>;
    findByUuid(uuid: string): Promise<T>;
    findAll(): Promise<Array<T>>;
    update(uuid: string, entity: Partial<T>): Promise<T>;
}
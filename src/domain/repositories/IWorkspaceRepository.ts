import { Workspace } from '../entities/Workspace';
import type { IBaseRepository } from './IBaseRepository';

export interface IWorkspaceRepository extends IBaseRepository<Workspace> {
    findByCreatedBy(createdByUuid: string): Promise<Array<Workspace>>;
    findByWorkspaceKey(workspaceKey: string): Promise<Workspace | null>;
    update(uuid: string, entity: Workspace): Promise<Workspace>;
    findByUserUuid(userUuid: string): Promise<Array<Workspace>>;
}

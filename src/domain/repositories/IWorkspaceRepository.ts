import { Workspace } from '../entities/Workspace.js';
import type { IBaseRepository } from './IBaseRepository.js';

export interface IWorkspaceRepository extends IBaseRepository<Workspace> {
    findByCreatedBy(createdByUuid: string): Promise<Workspace[]>;
    findByWorkspaceKey(workspaceKey: string): Promise<Workspace | null>;
    update(uuid: string, entity: Workspace): Promise<Workspace>;
}

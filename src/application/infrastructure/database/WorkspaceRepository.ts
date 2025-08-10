import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { Workspace } from '../../../domain/entities/Workspace.js';
import type { IWorkspaceRepository } from '../../../domain/repositories/IWorkspaceRepository.js';
import { BaseRepository } from './BaseRepository.js';

export class WorkspaceRepository extends BaseRepository<Workspace> implements IWorkspaceRepository {
    constructor(prisma: PrismaClient) {
        super(prisma);
    }

    protected getModelName(): string {
        return 'workspace';
    }

    protected mapToEntity(record: any): Workspace {
        return Workspace.fromJson({
            uuid: record.uuid,
            workspaceKey: record.workspaceKey,
            name: record.name,
            createdBy: record.createdBy,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            deletedAt: record.deletedAt,
            active: record.active,
        });
    }

    async findByCreatedBy(createdByUuid: string): Promise<Workspace[]> {
        const records: Array<any> = await this.prisma.workspace.findMany({
            where: { createdBy: createdByUuid, active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }
}
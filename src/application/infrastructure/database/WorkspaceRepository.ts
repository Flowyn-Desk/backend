import type { PrismaClient } from "@prisma/client";
import { Workspace } from "../../../domain/entities/Workspace.js";
import type { IWorkspaceRepository } from "../../../domain/repositories/IWorkspaceRepository.js";
import { BaseRepository } from "./BaseRepository.js";

export class WorkspaceRepository extends BaseRepository<Workspace> implements IWorkspaceRepository {
    constructor(prisma: PrismaClient) {
        super(prisma);
    }

    protected getModelName(): string {
        return 'workspace';
    }

    protected mapToEntity(record: any): Workspace {
        return new Workspace(
            record.workspace_key,
            record.name,
            record.created_by,
            [],
            record.uuid,
            record.created_at,
            record.updated_at,
            record.deleted_at,
            record.active,
        );
    }

    async findByCreatedBy(createdByUuid: string): Promise<Workspace[]> {
        const records: Array<any> = await this.prisma.workspace.findMany({
            where: { createdBy: createdByUuid, active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async findByWorkspaceKey(workspaceKey: string): Promise<Workspace | null> {
        const record = await this.prisma.workspace.findUnique({
            where: { workspaceKey: workspaceKey },
        });
        if (!record || !record.active) {
            return null;
        }
        return this.mapToEntity(record);
    }
}

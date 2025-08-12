import type { PrismaClient } from "@prisma/client";
import { Workspace } from "../../../domain/entities/Workspace";
import type { IWorkspaceRepository } from "../../../domain/repositories/IWorkspaceRepository";
import { BaseRepository } from "./BaseRepository";

export class WorkspaceRepository extends BaseRepository<Workspace> implements IWorkspaceRepository {
    constructor(prisma: PrismaClient) {
        super(prisma);
    }

    protected getModelName(): string {
        return 'workspace';
    }

    protected mapToEntity(record: any): Workspace {
        return Workspace.fromJson(
            record
        );
    }

    async create(entity: Workspace): Promise<Workspace> {
        const data = entity.toJson();
        const userIds = data.userIds ?? [];
        delete data.userIds;
        const created = await this.prisma.workspace.create({
            data: {
                ...data,
                userWorkspaces: {
                    create: userIds.map(userUuid => ({ userUuid })),
                },
            },
            include: {
                userWorkspaces: true,
            },
        });
        const workspace = this.mapToEntity(created);
        workspace.userIds = created.userWorkspaces?.map(uw => uw.userUuid) ?? [];
    
        return workspace;
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

    async findByUserUuid(userUuid: string): Promise<Workspace[]> {
        const records: Array<any> = await this.prisma.workspace.findMany({
            where: {
                active: true,
                OR: [
                    { createdBy: userUuid },
                    { userWorkspaces: { some: { userUuid } } }
                ]
            },
            include: {
                userWorkspaces: true
            }
        });
    
        return records.map(record => {
            const workspace = this.mapToEntity(record);
            workspace.userIds = record.userWorkspaces?.map(userWorkspace => userWorkspace.userUuid) ?? [];
            return workspace;
        });
    }
}

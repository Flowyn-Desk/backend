import { StatusCodes } from 'http-status-codes';
import { BaseService } from './BaseService';
import type { IWorkspaceRepository } from '../../domain/repositories/IWorkspaceRepository';
import type { IWorkspaceService } from '../../domain/services/IWorkspaceService';
import type { WorkspaceRequestDto } from '../../application/dto/workspace/WorkspaceRequestDto';
import type { WorkspaceResponseDto } from '../../application/dto/workspace/WorkspaceResponseDto';
import { ServiceResponse } from '../../domain/services/ServiceResponse';
import { Workspace } from '../../domain/entities/Workspace';
import { BadRequestError } from '../../shared/Errors/BadRequestError';
import { NotFoundError } from '../../shared/Errors/NotFoundError';
import { ForbiddenError } from '../../shared/Errors/ForbiddenError';

export class WorkspaceService extends BaseService<
    Workspace,
    WorkspaceRequestDto,
    WorkspaceResponseDto,
    IWorkspaceRepository
> implements IWorkspaceService {

    constructor(repository: IWorkspaceRepository) {
        super(repository, 'WorkspaceService');
        this.create = this.exceptionCatcher.wrapMethod(this.create.bind(this), 'create');
        this.update = this.exceptionCatcher.wrapMethod(this.update.bind(this), 'update');
        this.getWorkspaceByKey = this.exceptionCatcher.wrapMethod(this.getWorkspaceByKey.bind(this), 'getWorkspaceByKey');
        this.addUserToWorkspace = this.exceptionCatcher.wrapMethod(this.addUserToWorkspace.bind(this), 'addUserToWorkspace');
        this.removeUserFromWorkspace = this.exceptionCatcher.wrapMethod(this.removeUserFromWorkspace.bind(this), 'removeUserFromWorkspace');
        this.getWorkspaceMembers = this.exceptionCatcher.wrapMethod(this.getWorkspaceMembers.bind(this), 'getWorkspaceMembers');
    }

    protected toResponseDto(entity: Workspace): WorkspaceResponseDto {
        return {
            uuid: entity.uuid,
            workspaceKey: entity.workspaceKey,
            name: entity.name,
            createdBy: entity.createdBy,
            userIds: entity.userIds ?? [],
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        };
    }

    protected toEntity(request: WorkspaceRequestDto): Workspace {
        return new Workspace(
            request.workspaceKey,
            request.name,
            request.createdBy,
            request.userIds ?? []
        );
    }

    protected updateEntity(entity: Workspace, updates: Partial<WorkspaceRequestDto>): Workspace {
        if (updates.name !== undefined) entity.name = updates.name;
        return entity;
    }

    async create(request: WorkspaceRequestDto): Promise<ServiceResponse<WorkspaceResponseDto>> {
        if (!request.userIds) {
            request.userIds = [];
        }
        if (!request.userIds.includes(request.createdBy)) {
            request.userIds.push(request.createdBy);
        }
        return super.create(request);
    }

    async update(uuid: string, updates: Partial<WorkspaceRequestDto>): Promise<ServiceResponse<WorkspaceResponseDto>> {
        const existingWorkspace = await this.repository.findByUuid(uuid);
        if (!existingWorkspace || !existingWorkspace.active) {
            throw new NotFoundError('Workspace not found');
        }
        if (!updates.createdBy) {
            throw new BadRequestError('Missing updater user ID');
        }

        if (existingWorkspace.createdBy !== updates.createdBy) {
            throw new ForbiddenError('Only the creator can update this workspace');
        }
        if (updates.userIds !== undefined) {
            delete updates.userIds;
        }
        return super.update(uuid, updates);
    }

    async getWorkspaceByKey(workspaceKey: string): Promise<ServiceResponse<WorkspaceResponseDto>> {
        const workspace = await this.repository.findByWorkspaceKey(workspaceKey);
        if (!workspace || !workspace.active) {
            throw new NotFoundError(`Workspace with key ${workspaceKey} not found`);
        }
        return new ServiceResponse(StatusCodes.OK, this.toResponseDto(workspace), 'Workspace found');
    }

    async addUserToWorkspace(workspaceUuid: string, userUuid: string): Promise<ServiceResponse<void>> {
        if (!this.isValidUuid(workspaceUuid) || !this.isValidUuid(userUuid)) {
            throw new BadRequestError('Invalid UUID format');
        }

        const workspace = await this.repository.findByUuid(workspaceUuid);
        if (!workspace || !workspace.active) {
            throw new NotFoundError('Workspace not found');
        }

        if (!workspace.userIds) {
            workspace.userIds = [];
        }

        if (!workspace.userIds.includes(userUuid)) {
            workspace.userIds.push(userUuid);
            await this.repository.update(workspaceUuid, workspace);
        }
        return new ServiceResponse(StatusCodes.OK, undefined, `User added to workspace ${workspaceUuid}`);
    }

    async removeUserFromWorkspace(workspaceUuid: string, userUuid: string): Promise<ServiceResponse<void>> {
        if (!this.isValidUuid(workspaceUuid) || !this.isValidUuid(userUuid)) {
            throw new BadRequestError('Invalid UUID format');
        }

        const workspace = await this.repository.findByUuid(workspaceUuid);
        if (!workspace || !workspace.active) {
            throw new NotFoundError('Workspace not found');
        }

        if (workspace.userIds?.includes(userUuid)) {
            workspace.userIds = workspace.userIds.filter(id => id !== userUuid);
            await this.repository.update(workspaceUuid, workspace);
        }

        return new ServiceResponse(StatusCodes.OK, undefined, `User removed from workspace ${workspaceUuid}`);
    }

    async getWorkspaceMembers(workspaceUuid: string): Promise<ServiceResponse<Array<string>>> {
        if (!this.isValidUuid(workspaceUuid)) {
            throw new BadRequestError('Invalid UUID format');
        }

        const workspace = await this.repository.findByUuid(workspaceUuid);
        if (!workspace || !workspace.active) {
            throw new NotFoundError('Workspace not found');
        }

        return new ServiceResponse(StatusCodes.OK, workspace.userIds ?? [], `Retrieved members of workspace ${workspaceUuid}`);
    }

    async getWorkspacesFromUser(userUuid: string): Promise<ServiceResponse<Array<WorkspaceResponseDto>>> {
        if (!this.isValidUuid(userUuid)) {
            throw new BadRequestError('Invalid UUID format');
        }
        const workspaces = await this.repository.findByUserUuid(userUuid);
        const responseDtos = workspaces.map(workspace => this.toResponseDto(workspace));
    
        return new ServiceResponse(
            StatusCodes.OK,
            responseDtos,
            `Found ${responseDtos.length} workspace(s) for user ${userUuid}`
        );
    }
}

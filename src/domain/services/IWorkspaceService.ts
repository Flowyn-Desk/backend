import type { WorkspaceRequestDto } from "../../application/dto/workspace/WorkspaceRequestDto";
import type { WorkspaceResponseDto } from "../../application/dto/workspace/WorkspaceResponseDto";
import type { IBaseService } from "./IBaseService";
import type { ServiceResponse } from "./ServiceResponse";

export interface IWorkspaceService extends IBaseService<WorkspaceRequestDto, WorkspaceResponseDto> {
    getWorkspaceByKey(workspaceKey: string): Promise<ServiceResponse<WorkspaceResponseDto>>;
    addUserToWorkspace(workspaceUuid: string, userUuid: string): Promise<ServiceResponse<void>>;
    removeUserFromWorkspace(workspaceUuid: string, userUuid: string): Promise<ServiceResponse<void>>;
    getWorkspaceMembers(workspaceUuid: string): Promise<ServiceResponse<Array<string>>>;
    getWorkspacesFromUser(userUuid: string): Promise<ServiceResponse<Array<WorkspaceResponseDto>>>;
}
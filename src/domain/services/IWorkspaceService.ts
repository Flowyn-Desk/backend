import type { WorkspaceRequestDto } from "../../application/dto/workspace/WorkspaceRequestDto.js";
import type { WorkspaceResponseDto } from "../../application/dto/workspace/WorkspaceResponseDto.js";
import type { IBaseService } from "./IBaseService.js";
import type { ServiceResponse } from "./ServiceResponse.js";

export interface IWorkspaceService extends IBaseService<WorkspaceRequestDto, WorkspaceResponseDto> {
    getWorkspaceByKey(workspaceKey: string): Promise<ServiceResponse<WorkspaceResponseDto>>;
    addUserToWorkspace(workspaceUuid: string, userUuid: string): Promise<ServiceResponse<void>>;
    removeUserFromWorkspace(workspaceUuid: string, userUuid: string): Promise<ServiceResponse<void>>;
    getWorkspaceMembers(workspaceUuid: string): Promise<ServiceResponse<Array<string>>>;
}
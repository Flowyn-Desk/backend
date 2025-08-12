import type { BaseResponseDto } from "../BaseResponseDto";

export interface WorkspaceResponseDto extends BaseResponseDto {
    workspaceKey: string;
    name: string;
    createdBy: string;
    userIds: Array<string>;
  }
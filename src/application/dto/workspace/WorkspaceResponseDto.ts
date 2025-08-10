import type { BaseResponseDto } from "../BaseResponseDto.js";

export interface WorkspaceResponseDto extends BaseResponseDto {
    workspaceKey: string;
    name: string;
    createdBy: string;
  }
export interface WorkspaceRequestDto {
    workspaceKey: string;
    name: string;
    createdBy: string;
    userIds: Array<string>;
  }
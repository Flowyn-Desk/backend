import type { UserRequestDto } from "../../application/dto/user/UserRequestDto.js";
import type { UserResponseDto } from "../../application/dto/user/UserResponseDto.js";
import type { UserRole } from "../enums/UserRole.js";
import type { IBaseService } from "./IBaseService.js";
import type { ServiceResponse } from "./ServiceResponse.js";

export interface IUserService extends IBaseService<UserRequestDto, UserResponseDto> {
    getUserByEmail(email: string): Promise<ServiceResponse<UserResponseDto | null>>;
    getUsersByRole(role: UserRole): Promise<ServiceResponse<Array<UserResponseDto>>>;
    getUsersByWorkspace(workspaceUuid: string): Promise<ServiceResponse<Array<UserResponseDto>>>;
    authenticateUser(email: string, password: string): Promise<ServiceResponse<UserResponseDto | null>>;
    validateUserPermissions(userUuid: string, requiredRole: UserRole): Promise<ServiceResponse<boolean>>;
    changePassword(userUuid: string, oldPassword: string, newPassword: string): Promise<ServiceResponse<void>>;
}
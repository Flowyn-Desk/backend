import type { UserRole } from "../../../generated/prisma/index";
import type { UserResponseDto } from "../../application/dto/user/UserResponseDto";
import type { ServiceResponse } from "./ServiceResponse";

export interface IAuthService {
    hashPassword(password: string): Promise<ServiceResponse<string>>;
    verifyPassword(password: string, hash: string): Promise<ServiceResponse<boolean>>;
    generateToken(user: UserResponseDto): Promise<ServiceResponse<string>>;
    verifyToken(token: string): ServiceResponse<UserResponseDto | null>;
    userHasAccess(token: string, role: UserRole): ServiceResponse<boolean>;
}
import type { UserResponseDto } from "../../application/dto/user/UserResponseDto.js";
import type { ServiceResponse } from "./ServiceResponse.js";

export interface IAuthService {
    hashPassword(password: string): Promise<ServiceResponse<string>>;
    verifyPassword(password: string, hash: string): Promise<ServiceResponse<boolean>>;
    generateToken(user: UserResponseDto): Promise<ServiceResponse<string>>;
    verifyToken(token: string): Promise<ServiceResponse<UserResponseDto | null>>;
}
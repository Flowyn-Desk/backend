import type { UserRole } from "../../../domain/enums/UserRole.js";
import type { BaseResponseDto } from "../BaseResponseDto.js";

export interface UserResponseDto extends BaseResponseDto {
    email: string;
    name: string;
    role: UserRole;
  }
  
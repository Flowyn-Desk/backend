import type { UserRole } from "../../../domain/enums/UserRole";
import type { BaseResponseDto } from "../BaseResponseDto";

export interface UserResponseDto extends BaseResponseDto {
    email: string;
    name: string;
    role: UserRole;
  }
  
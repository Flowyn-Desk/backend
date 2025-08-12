import type { UserRole } from "../../../domain/enums/UserRole.js";

export interface UserRequestDto {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }
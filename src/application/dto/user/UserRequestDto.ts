import type { UserRole } from "../../../domain/enums/UserRole";

export interface UserRequestDto {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }
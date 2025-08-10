import { User } from '../entities/User.js';
import { UserRole } from '../enums/UserRole.js';
import type { IBaseRepository } from './IBaseRepository.js';

export interface IUserRepository extends IBaseRepository<User> {
    findByEmail(email: string): Promise<User | null>;
    findByRole(role: UserRole): Promise<User[]>;
    findByWorkspace(workspaceUuid: string): Promise<User[]>;
}
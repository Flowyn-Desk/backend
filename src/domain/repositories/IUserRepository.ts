import { User } from '../entities/User.js';
import { UserRole } from '../enums/UserRole.js';
import type { IBaseRepository } from './IBaseRepository.js';

export interface IUserRepository extends IBaseRepository<User> {
    findByEmail(email: string): Promise<User>;
    findByRole(role: UserRole): Promise<Array<User>>;
    findByWorkspace(workspaceUuid: string): Promise<Array<User>>;
}
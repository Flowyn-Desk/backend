import { User } from '../entities/User';
import { UserRole } from '../enums/UserRole';
import type { IBaseRepository } from './IBaseRepository';

export interface IUserRepository extends IBaseRepository<User> {
    findByEmail(email: string): Promise<User>;
    findByRole(role: UserRole): Promise<Array<User>>;
    findByWorkspace(workspaceUuid: string): Promise<Array<User>>;
}
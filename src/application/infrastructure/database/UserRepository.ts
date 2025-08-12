import { User } from "../../../domain/entities/User";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { BaseRepository } from "./BaseRepository";
import type { UserRole } from "../../../domain/enums/UserRole";
import type { PrismaClient } from "../../../../generated/prisma/client";
import { NotFoundError } from "../../../shared/Errors/NotFoundError";

export class UserRepository extends BaseRepository<User> implements IUserRepository {
    constructor(prisma: PrismaClient) {
        super(prisma);
    }

    protected getModelName(): string {
        return 'user';
    }

    protected mapToEntity(record: any): User {
        return User.fromJson({
            uuid: record.uuid,
            email: record.email,
            passwordHash: record.passwordHash,
            name: record.name,
            role: record.role,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            deletedAt: record.deletedAt,
            active: record.active,
        });
    }

    async findByEmail(email: string): Promise<User> {
        const record = await this.prisma.user.findFirst({
            where: { email, active: true },
        });
        if (!record) {
            throw new NotFoundError(`The user ${email} was not found`)
        }
        return this.mapToEntity(record);
    }

    async findByRole(role: UserRole): Promise<Array<User>> {
        const records: Array<any> = await this.prisma.user.findMany({
            where: { role, active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async findByWorkspace(workspaceUuid: string): Promise<User[]> {
        const records = await this.prisma.user.findMany({
            where: {
                userWorkspaces: {
                    some: {
                        workspaceUuid,
                        workspace: { active: true }
                    }
                },
                active: true
            }
        });
        return records.map(record => this.mapToEntity(record));
    }
}
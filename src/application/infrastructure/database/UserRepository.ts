import { User } from "../../../domain/entities/User.js";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import { BaseRepository } from "./BaseRepository.js";
import type { UserRole } from "../../../domain/enums/UserRole.js";
import type { PrismaClient } from "../../../../generated/prisma/client.js";

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

    async findByEmail(email: string): Promise<User | null> {
        const record = await this.prisma.user.findFirst({
            where: { email, active: true },
        });
        return record ? this.mapToEntity(record) : null;
    }

    async findByRole(role: UserRole): Promise<User[]> {
        const records: Array<any> = await this.prisma.user.findMany({
            where: { role, active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async findByWorkspace(workspaceUuid: string): Promise<User[]> {
        const records: Array<any> = await this.prisma.user.findMany({
            where: {
                createdWorkspaces: { some: { uuid: workspaceUuid, active: true } },
                active: true,
            },
        });
        return records.map(record => this.mapToEntity(record));
    }
}
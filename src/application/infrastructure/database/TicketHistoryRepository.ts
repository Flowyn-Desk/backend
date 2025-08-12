import type { PrismaClient } from "../../../../generated/prisma/client.js";
import { TicketHistory } from "../../../domain/entities/TicketHistory.js";
import type { ITicketHistoryRepository } from "../../../domain/repositories/ITicketHistoryRepository.js";
import { BaseRepository } from "./BaseRepository.js";

export class TicketHistoryRepository extends BaseRepository<TicketHistory> implements ITicketHistoryRepository {
    constructor(prisma: PrismaClient) {
        super(prisma);
    }

    protected getModelName(): string {
        return 'ticketHistory';
    }

    protected mapToEntity(record: any): TicketHistory {
        return TicketHistory.fromJson({
            uuid: record.uuid,
            ticketUuid: record.ticketUuid,
            userUuid: record.userUuid,
            previousStatus: record.previousStatus,
            newStatus: record.newStatus,
            previousSeverity: record.previousSeverity,
            newSeverity: record.newSeverity,
            changeReason: record.changeReason,
            timestamp: record.timestamp,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            deletedAt: record.deletedAt,
            active: record.active,
        });
    }

    async findByTicket(ticketUuid: string): Promise<TicketHistory[]> {
        const records: Array<any> = await this.prisma.ticketHistory.findMany({
            where: { ticketUuid, active: true },
            orderBy: { timestamp: 'desc' },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async findByUser(userUuid: string): Promise<TicketHistory[]> {
        const records: Array<any> = await this.prisma.ticketHistory.findMany({
            where: { userUuid, active: true },
            orderBy: { timestamp: 'desc' },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async findRecentActivity(limit: number = 10): Promise<TicketHistory[]> {
        const records: Array<any> = await this.prisma.ticketHistory.findMany({
            where: { active: true },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
        return records.map(record => this.mapToEntity(record));
    }
}
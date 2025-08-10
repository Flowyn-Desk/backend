import type { PrismaClient } from "@prisma/client";
import { Ticket } from "../../../domain/entities/Ticket.js";
import type { ITicketRepository } from "../../../domain/repositories/ITicketRepository.js";
import { BaseRepository } from "./BaseRepository.js";
import { TicketStatus } from "../../../domain/enums/TicketStatus.js";

export class TicketRepository extends BaseRepository<Ticket> implements ITicketRepository {
    constructor(prisma: PrismaClient) {
        super(prisma);
    }

    protected getModelName(): string {
        return 'tickets';
    }

    protected mapToEntity(record: any): Ticket {
        return Ticket.fromJson({
            uuid: record.uuid,
            ticketNumber: record.ticketNumber,
            workspaceUuid: record.workspaceUuid,
            createdByUuid: record.createdByUuid,
            title: record.title,
            description: record.description,
            category: record.category,
            severity: record.severity,
            status: record.status,
            severityChangeReason: record.severityChangeReason,
            dueDate: record.dueDate,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            deletedAt: record.deletedAt,
            active: record.active,
        });
    }

    async findByStatus(status: TicketStatus): Promise<Ticket[]> {
        const records: Array<any> = await this.prisma.ticket.findMany({
            where: { status, active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async findByCreatedBy(createdByUuid: string): Promise<Ticket[]> {
        const records: Array<any> = await this.prisma.ticket.findMany({
            where: { createdByUuid, active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async findByWorkspace(workspaceUuid: string): Promise<Ticket[]> {
        const records: Array<any> = await this.prisma.ticket.findMany({
            where: { workspaceUuid, active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async findPendingTickets(): Promise<Ticket[]> {
        const records: Array<any> = await this.prisma.ticket.findMany({
            where: { status: TicketStatus.PENDING, active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async findByTicketNumber(ticketNumber: string): Promise<Ticket | null> {
        const record = await this.prisma.ticket.findFirst({
            where: { ticketNumber, active: true },
        });
        return record ? this.mapToEntity(record) : null;
    }

    async getNextSequenceNumber(year: number, workspaceUuid: string): Promise<number> {
        const latestTicket = await this.prisma.ticket.findFirst({
            where: {
                ticketNumber: { startsWith: `TKT-${year}-` },
                workspaceUuid,
                active: true,
            },
            orderBy: { ticketNumber: 'desc' },
        });
    
        if (!latestTicket) {
            return 1;
        }
    
        const parts = latestTicket.ticketNumber.split('-');
        const sequenceStr = parts[2] ?? '0';
        const sequence = parseInt(sequenceStr, 10);
    
        if (isNaN(sequence)) {
            return 1;
        }
    
        return sequence + 1;
    }
    
    async findByStatusAndWorkspace(status: TicketStatus, workspaceUuid: string): Promise<Ticket[]> {
        const records: Array<any> = await this.prisma.ticket.findMany({
            where: { status, workspaceUuid, active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }

    async bulkUpdateStatus(ticketUuids: string[], newStatus: TicketStatus): Promise<Ticket[]> {
        await this.prisma.ticket.updateMany({
            where: {
                uuid: { in: ticketUuids },
                active: true,
            },
            data: {
                status: newStatus,
            },
        });
        const records: Array<any> = await this.prisma.ticket.findMany({
            where: { uuid: { in: ticketUuids }, active: true },
        });
        return records.map(record => this.mapToEntity(record));
    }
}
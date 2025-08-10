import { Ticket } from '../entities/Ticket.js';
import { TicketStatus } from '../enums/TicketStatus.js';
import type { IBaseRepository } from './IBaseRepository.js';

export interface ITicketRepository extends IBaseRepository<Ticket> {
    findByStatus(status: TicketStatus): Promise<Ticket[]>;
    findByCreatedBy(createdByUuid: string): Promise<Ticket[]>;
    findByWorkspace(workspaceUuid: string): Promise<Ticket[]>;
    findPendingTickets(): Promise<Ticket[]>;
    findByTicketNumber(ticketNumber: string): Promise<Ticket | null>;
    getNextSequenceNumber(year: number, workspaceUuid: string): Promise<number>;
    findByStatusAndWorkspace(status: TicketStatus, workspaceUuid: string): Promise<Ticket[]>;
    bulkUpdateStatus(ticketUuids: string[], newStatus: TicketStatus): Promise<Ticket[]>;
}
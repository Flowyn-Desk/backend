import { Ticket } from '../entities/Ticket';
import { TicketStatus } from '../enums/TicketStatus';
import type { IBaseRepository } from './IBaseRepository';

export interface ITicketRepository extends IBaseRepository<Ticket> {
    findByStatus(workspaceUuid: string, status: TicketStatus): Promise<Array<Ticket>>;
    findByCreatedBy(createdByUuid: string): Promise<Array<Ticket>>;
    findByWorkspace(workspaceUuid: string): Promise<Array<Ticket>>;
    findPendingTickets(): Promise<Array<Ticket>>;
    findByTicketNumber(ticketNumber: string): Promise<Ticket>;
    getNextSequenceNumber(year: number, workspaceUuid: string): Promise<number>;
    findByStatusAndWorkspace(status: TicketStatus, workspaceUuid: string): Promise<Array<Ticket>>;
    bulkUpdateStatus(ticketUuids: string[], newStatus: TicketStatus): Promise<Array<Ticket>>;
    findAllByWorkspaceId(workspaceUuid: string): Promise<Array<Ticket>>;
}
import { TicketHistory } from '../entities/TicketHistory';
import type { IBaseRepository } from './IBaseRepository';

export interface ITicketHistoryRepository extends IBaseRepository<TicketHistory> {
    findByTicket(ticketUuid: string): Promise<Array<TicketHistory>>;
    findByUser(userUuid: string): Promise<Array<TicketHistory>>;
    findRecentActivity(limit?: number): Promise<Array<TicketHistory>>;
}

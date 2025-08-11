import { TicketHistory } from '../entities/TicketHistory.js';
import type { IBaseRepository } from './IBaseRepository.js';

export interface ITicketHistoryRepository extends IBaseRepository<TicketHistory> {
    findByTicket(ticketUuid: string): Promise<Array<TicketHistory>>;
    findByUser(userUuid: string): Promise<Array<TicketHistory>>;
    findRecentActivity(limit?: number): Promise<Array<TicketHistory>>;
}

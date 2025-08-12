import type { ServiceResponse } from "./ServiceResponse";
import type { IBaseService } from "./IBaseService";
import type { TicketHistoryRequestDto } from "../../application/dto/ticket_history/TicketHistoryRequestDto";
import type { TicketHistoryResponseDto } from "../../application/dto/ticket_history/TicketHistoryResponseDto";


export interface ITicketHistoryService extends IBaseService<TicketHistoryRequestDto, TicketHistoryResponseDto> {
  findByTicket(ticketUuid: string): Promise<ServiceResponse<Array<TicketHistoryResponseDto>>>;
  findByUser(userUuid: string): Promise<ServiceResponse<Array<TicketHistoryResponseDto>>>;
  findRecentActivity(limit?: number): Promise<ServiceResponse<Array<TicketHistoryResponseDto>>>;
}

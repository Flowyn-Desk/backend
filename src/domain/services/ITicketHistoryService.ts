import type { ServiceResponse } from "./ServiceResponse.js";
import type { IBaseService } from "./IBaseService.js";
import type { TicketHistoryRequestDto } from "../../application/dto/ticket_history/TicketHistoryRequestDto.ts";
import type { TicketHistoryResponseDto } from "../../application/dto/ticket_history/TicketHistoryResponseDto.ts";


export interface ITicketHistoryService extends IBaseService<TicketHistoryRequestDto, TicketHistoryResponseDto> {
  findByTicket(ticketUuid: string): Promise<ServiceResponse<TicketHistoryResponseDto[]>>;
  findByUser(userUuid: string): Promise<ServiceResponse<TicketHistoryResponseDto[]>>;
  findRecentActivity(limit?: number): Promise<ServiceResponse<TicketHistoryResponseDto[]>>;
}

import type { TicketRequestDto } from "../../application/dto/ticket/TicketRequestDto";
import type { TicketResponseDto } from "../../application/dto/ticket/TicketResponseDto";
import type { TicketHistoryResponseDto } from "../../application/dto/ticket_history/TicketHistoryResponseDto";
import type { Ticket } from "../entities/Ticket.ts";
import type { TicketSeverity } from "../enums/TicketSeverity";
import type { TicketStatus } from "../enums/TicketStatus";
import type { IBaseService } from "./IBaseService";
import type { ServiceResponse } from "./ServiceResponse";

export interface ITicketService extends IBaseService<TicketRequestDto, TicketResponseDto> {
    create(request: TicketRequestDto): Promise<ServiceResponse<TicketResponseDto>>;
    getTicketByNumber(ticketNumber: string): Promise<ServiceResponse<TicketResponseDto | null>>;
    getTicketsByStatus(workspaceUuid: string, status: TicketStatus): Promise<ServiceResponse<Array<TicketResponseDto>>>;
    getTicketsByCreator(createdByUuid: string): Promise<ServiceResponse<Array<TicketResponseDto>>>;
    getTicketsByWorkspace(workspaceUuid: string): Promise<ServiceResponse<Array<TicketResponseDto>>>;
    reviewTicket(ticketUuid: string, managerUuid: string, newSeverity?: TicketSeverity, reason?: string): Promise<ServiceResponse<TicketResponseDto>>;
    updateTicketDetails(ticketUuid: string, associateUuid: string, title?: string, description?: string): Promise<ServiceResponse<TicketResponseDto>>;
    canUserReviewTicket(ticketUuid: string, managerUuid: string): Promise<ServiceResponse<boolean>>;
    suggestSeverity(title: string, description: string): Promise<ServiceResponse<TicketSeverity>>;
    exportPendingTickets(workspaceUuid: string): Promise<ServiceResponse<string>>;
    importTicketStatuses(csvContent: string): Promise<ServiceResponse<void>>;
    getTicketHistory(ticketUuid: string): Promise<ServiceResponse<Array<TicketHistoryResponseDto>>>;
    exportTicketsToCsv(tickets: Array<Ticket>): Promise<ServiceResponse<string>>;
    updateCsvToTickets(csvContent: string): Promise<ServiceResponse<Array<TicketResponseDto>>>
}
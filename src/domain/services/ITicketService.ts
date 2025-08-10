import type { TicketRequestDto } from "../../application/dto/ticket/TicketRequestDto.js";
import type { TicketResponseDto } from "../../application/dto/ticket/TicketResponseDto.js";
import type { TicketHistory } from "../entities/TicketHistory.js";
import type { TicketSeverity } from "../enums/TicketSeverity.js";
import type { TicketStatus } from "../enums/TicketStatus.js";
import type { IBaseService } from "./IBaseService.js";
import type { ServiceResponse } from "./ServiceResponse.js";

export interface ITicketService extends IBaseService<TicketRequestDto, TicketResponseDto> {
    create(request: TicketRequestDto): Promise<ServiceResponse<TicketResponseDto>>;
    getTicketByNumber(ticketNumber: string): Promise<ServiceResponse<TicketResponseDto | null>>;
    getTicketsByStatus(status: TicketStatus): Promise<ServiceResponse<TicketResponseDto[]>>;
    getTicketsByCreator(createdByUuid: string): Promise<ServiceResponse<TicketResponseDto[]>>;
    getTicketsByWorkspace(workspaceUuid: string): Promise<ServiceResponse<TicketResponseDto[]>>;
    reviewTicket(ticketUuid: string, managerUuid: string, newSeverity?: TicketSeverity, reason?: string): Promise<ServiceResponse<TicketResponseDto>>;
    updateTicketDetails(ticketUuid: string, associateUuid: string, title?: string, description?: string): Promise<ServiceResponse<TicketResponseDto>>;
    canUserReviewTicket(ticketUuid: string, managerUuid: string): Promise<ServiceResponse<boolean>>;
    suggestSeverity(title: string, description: string): Promise<ServiceResponse<TicketSeverity>>;
    exportPendingTickets(): Promise<ServiceResponse<string>>;
    importTicketStatuses(csvContent: string): Promise<ServiceResponse<void>>;
    getTicketHistory(ticketUuid: string): Promise<ServiceResponse<TicketHistory[]>>;
}
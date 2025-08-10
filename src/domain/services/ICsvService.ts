import type { TicketResponseDto } from "../../application/dto/ticket/TicketResponseDto.js";
import type { Ticket } from "../entities/Ticket.js";
import type { ServiceResponse } from "./ServiceResponse.js";

export interface ICsvService {
    exportTicketsToCsv(tickets: Ticket[]): Promise<ServiceResponse<string>>;
    updateCsvToTickets(csvContent: string): Promise<ServiceResponse<Array<TicketResponseDto>>>
}
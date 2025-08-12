import type { TicketSeverity } from "../../../domain/enums/TicketSeverity";
import type { TicketStatus } from "../../../domain/enums/TicketStatus";

export interface TicketHistoryRequestDto{
  ticketUuid: string;
  userUuid: string;
  newStatus: TicketStatus;
  newSeverity: TicketSeverity;
  changeReason: string;
}

import type { TicketSeverity } from "../../../domain/enums/TicketSeverity.js";
import type { TicketStatus } from "../../../domain/enums/TicketStatus.js";

export interface TicketHistoryRequestDto{
  ticketUuid: string;
  userUuid: string;
  newStatus: TicketStatus;
  newSeverity: TicketSeverity;
  changeReason: string;
}

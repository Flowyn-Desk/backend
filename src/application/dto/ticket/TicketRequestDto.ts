import type { TicketSeverity } from "../../../domain/enums/TicketSeverity.js";
import type { TicketStatus } from "../../../domain/enums/TicketStatus.js";

export interface TicketRequestDto {
  ticketNumber: string;
  workspaceUuid: string;
  createdByUuid: string;
  title: string;
  description: string;
  severity: TicketSeverity;
  status: TicketStatus;
  severityChangeReason: string;
  dueDate: Date;
}

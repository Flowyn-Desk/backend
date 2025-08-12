import type { TicketSeverity } from "../../../domain/enums/TicketSeverity.js";
import type { TicketStatus } from "../../../domain/enums/TicketStatus.js";
import type { BaseResponseDto } from "../BaseResponseDto.js";

export interface TicketResponseDto extends BaseResponseDto {
  ticketNumber: string;
  workspaceUuid: string;
  createdByUuid: string;
  title: string;
  description: string;
  severity: TicketSeverity;
  status: TicketStatus;
  severityChangeReason: string | null;
  dueDate: Date;
}

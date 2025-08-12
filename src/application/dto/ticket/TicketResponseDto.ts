import type { TicketSeverity } from "../../../domain/enums/TicketSeverity";
import type { TicketStatus } from "../../../domain/enums/TicketStatus";
import type { BaseResponseDto } from "../BaseResponseDto";

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

import type { TicketSeverity } from "../../../domain/enums/TicketSeverity";
import type { TicketStatus } from "../../../domain/enums/TicketStatus";
import type { BaseResponseDto } from "../BaseResponseDto";

export interface TicketHistoryResponseDto extends BaseResponseDto {
  ticketUuid: string;
  userUuid: string;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  previousSeverity?: TicketSeverity | null;
  newSeverity?: TicketSeverity | null;
  changeReason?: string | null;
}

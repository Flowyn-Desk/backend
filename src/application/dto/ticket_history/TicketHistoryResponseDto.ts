import type { TicketSeverity } from "../../../domain/enums/TicketSeverity.js";
import type { TicketStatus } from "../../../domain/enums/TicketStatus.js";
import type { BaseResponseDto } from "../BaseResponseDto.js";

export interface TicketHistoryResponseDto extends BaseResponseDto {
  ticketUuid: string;
  userUuid: string;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  previousSeverity?: TicketSeverity | null;
  newSeverity?: TicketSeverity | null;
  changeReason?: string | null;
}

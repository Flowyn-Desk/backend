import type { TicketSeverity } from "../enums/TicketSeverity.js";
import type { ServiceResponse } from "./ServiceResponse.js";

export interface IAiService {
    suggestSeverity(title: string, description: string): Promise<ServiceResponse<TicketSeverity>>;
}
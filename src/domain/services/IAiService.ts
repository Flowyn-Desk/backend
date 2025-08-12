import type { TicketSeverity } from "../enums/TicketSeverity";
import type { ServiceResponse } from "./ServiceResponse";

export interface IAiService {
    suggestSeverity(title: string, description: string): Promise<ServiceResponse<TicketSeverity>>;
}
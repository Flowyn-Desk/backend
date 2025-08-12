import { StatusCodes } from "http-status-codes";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IAiService } from "../../domain/services/IAiService.js";
import { TicketSeverity } from "../../domain/enums/TicketSeverity.js";
import { ServiceResponse } from "../../domain/services/ServiceResponse.js";
import { Logger } from "../../shared/Logger.js";

export class IaService implements IAiService {
    private readonly client: GoogleGenerativeAI;
    private readonly model: string;
    private readonly logger: Logger;

    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error("GOOGLE_API_KEY environment variable is not set.");
        }
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = "gemini-1.5-flash";
        this.logger = new Logger('IaService')
    }

    async suggestSeverity(
        title: string,
        description: string
    ): Promise<ServiceResponse<TicketSeverity>> {
        
        this.logger.logInfo('Suggesting a new severity');
        const prompt = `
You are an AI assistant helping to categorize support tickets by severity. Based on the ticket title and description below, suggest the most appropriate severity level from this list:

- VERY_HIGH: Critical issue requiring immediate attention; likely to severely impact business or many users.
- HIGH: High-priority issue with significant impact that should be addressed soon.
- MEDIUM: Moderate impact issue that needs timely resolution but is not urgent.
- LOW: Minor issue with low impact, can be scheduled for later resolution.
- EASY: Very minor or trivial issue, requires minimal effort and can be resolved quickly.

Analyze the urgency, impact, and technical details in the ticket title and description, then provide exactly one severity level from the list above.

Ticket Title: ${title}
Ticket Description: ${description}

Suggested Severity:
`;

        try {
            const model = this.client.getGenerativeModel({ model: this.model });

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawSeverity = response.text() ?? "";

            const severity = this.mapToSeverityEnum(rawSeverity);

            if (!severity) {
                const fallback = this.getRandomSeverity();
                return new ServiceResponse(
                    StatusCodes.OK,
                    fallback,
                    "AI returned invalid severity, using fallback"
                );
            }
            this.logger.logInfo(`The suggested severity is ${severity}`);
            return new ServiceResponse(
                StatusCodes.OK,
                severity,
                "AI severity suggestion successful"
            );
        } catch (error) {
            this.logger.logError(`Google AI call failed: ${(error as Error).message}`);
            const fallback = this.getRandomSeverity();
            return new ServiceResponse(
                StatusCodes.OK,
                fallback,
                "AI service unavailable, using fallback severity"
            );
        }
    }

    private mapToSeverityEnum(severityStr: string): TicketSeverity | undefined {
        const key = severityStr.trim().toUpperCase();
        if (Object.values(TicketSeverity).includes(key as TicketSeverity)) {
            return key as TicketSeverity;
        }
        return undefined;
    }

    private getRandomSeverity(): TicketSeverity {
        const severities = Object.values(TicketSeverity);
        const randomIndex = Math.floor(Math.random() * severities.length);
        const severity = severities[randomIndex] as TicketSeverity
        return severity;
    }
}
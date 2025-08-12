import { IsString, IsUUID, IsEnum, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseEntity } from './BaseEntity';
import { TicketSeverity } from '../enums/TicketSeverity';
import { TicketStatus } from '../enums/TicketStatus';

export class Ticket extends BaseEntity {
    @IsString()
    ticketNumber: string; // Format: TKT-YYYY-XXXXXX

    @IsUUID()
    workspaceUuid: string;

    @IsUUID()
    createdByUuid: string;

    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsEnum(TicketSeverity)
    severity: TicketSeverity;

    @IsEnum(TicketStatus)
    status: TicketStatus;

    @IsOptional()
    @IsString()
    severityChangeReason: string | undefined;

    @IsDate()
    @Type(() => Date)
    dueDate: Date;

    constructor(
        ticketNumber: string,
        workspaceUuid: string,
        createdByUuid: string,
        title: string,
        description: string,
        severity: TicketSeverity,
        status: TicketStatus,
        dueDate: Date,
        severityChangeReason?: string | undefined,
        uuid?: string,
        createdAt?: Date,
        updatedAt?: Date,
        deletedAt?: Date,
        active?: boolean
    ) {
        super(uuid, createdAt, updatedAt, deletedAt, active);
        this.ticketNumber = ticketNumber;
        this.workspaceUuid = workspaceUuid;
        this.createdByUuid = createdByUuid;
        this.title = title;
        this.description = description;
        this.severity = severity;
        this.status = status;
        this.severityChangeReason = severityChangeReason;
        this.dueDate = this.parseDate(dueDate);
    }

    static generateTicketNumber(year: number, sequence: number): string {
        return `TKT-${year}-${sequence.toString().padStart(6, '0')}`;
    }

    canBeReviewedBy(managerUuid: string): boolean {
        return this.createdByUuid !== managerUuid && this.status === TicketStatus.DRAFT;
    }
    
    updateSeverity(newSeverity: TicketSeverity, reason: string, currentSeverity: TicketSeverity): TicketStatus {
        this.severityChangeReason = reason;
        this.severity = newSeverity;
        
        if (this.isSeverityIncreased(currentSeverity, newSeverity)) {
            return TicketStatus.REVIEW;
        }
        return TicketStatus.PENDING;
    }
    
    private isSeverityIncreased(currentSeverity: TicketSeverity, newSeverity: TicketSeverity): boolean {
        const severityOrder = {
            [TicketSeverity.EASY]: 0,
            [TicketSeverity.LOW]: 1,
            [TicketSeverity.MEDIUM]: 2,
            [TicketSeverity.HIGH]: 3,
            [TicketSeverity.VERY_HIGH]: 4
        };
        
        return severityOrder[newSeverity] > severityOrder[currentSeverity];
    }
}

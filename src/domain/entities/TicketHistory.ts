import 'reflect-metadata';
import { IsUUID, IsEnum, IsOptional, IsString} from 'class-validator';
import { BaseEntity } from './BaseEntity.js';
import { TicketStatus } from '../enums/TicketStatus.js';
import { TicketSeverity } from '../enums/TicketSeverity.js';

export class TicketHistory extends BaseEntity {
    @IsUUID()
    ticketUuid: string;

    @IsUUID()
    userUuid: string;

    @IsEnum(TicketStatus)
    previousStatus: TicketStatus;

    @IsEnum(TicketStatus)
    newStatus: TicketStatus;

    @IsOptional()
    previousTitle: string | undefined;

    @IsOptional()
    newTitle: string | undefined;

    @IsOptional()
    previousDescription: string | undefined;

    @IsOptional()
    newDescription: string | undefined;

    @IsOptional()
    @IsEnum(TicketSeverity)
    previousSeverity: TicketSeverity | undefined;

    @IsOptional()
    @IsEnum(TicketSeverity)
    newSeverity: TicketSeverity | undefined;

    @IsOptional()
    @IsString()
    changeReason: string | undefined;

    constructor(
        ticketUuid: string,
        userUuid: string,
        previousStatus: TicketStatus,
        newStatus: TicketStatus,
        previousSeverity: TicketSeverity,
        newSeverity: TicketSeverity,
        changeReason?: string,
        previousTitle?: string,
        newTitle?: string,
        previousDescription?: string,
        newDescription?: string,
        uuid?: string,
        createdAt?: Date,
        updatedAt?: Date,
        deletedAt?: Date,
        active?: boolean
    ) {
        super(uuid, createdAt, updatedAt, deletedAt, active);
        this.ticketUuid = ticketUuid;
        this.userUuid = userUuid;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.previousSeverity = previousSeverity;
        this.newSeverity = newSeverity;
        this.changeReason = changeReason;
        this.previousTitle = previousTitle;
        this.newTitle = newTitle;
        this.previousDescription = previousDescription;
        this.newDescription = newDescription;
    }
}

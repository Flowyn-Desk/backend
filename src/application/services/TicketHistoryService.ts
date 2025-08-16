import { StatusCodes } from 'http-status-codes';
import { TicketHistory } from '../../domain/entities/TicketHistory.js';
import type { ITicketHistoryRepository } from '../../domain/repositories/ITicketHistoryRepository.js';
import { BaseService } from './BaseService.js';
import { ServiceResponse } from '../../domain/services/ServiceResponse.js';
import type { TicketHistoryRequestDto } from '../dto/ticket_history/TicketHistoryRequestDto.js';
import type { TicketHistoryResponseDto } from '../dto/ticket_history/TicketHistoryResponseDto.js';
import type { ITicketRepository } from '../../domain/repositories/ITicketRepository.js';
import { ConflictError } from '../../shared/Errors/ConflictError.js';
import { BadRequestError } from '../../shared/Errors/BadRequestError.js';

export class TicketHistoryService extends BaseService<
    TicketHistory,
    TicketHistoryRequestDto,
    TicketHistoryResponseDto,
    ITicketHistoryRepository
> {

    protected readonly ticketRepository: ITicketRepository;

    constructor(repository: ITicketHistoryRepository, ticketRepository: ITicketRepository) {
        super(repository, 'TicketHistoryService');
        this.ticketRepository = ticketRepository;
        this.create = this.exceptionCatcher.wrapMethod(this.create.bind(this), 'createTicket');
        this.findByTicket = this.exceptionCatcher.wrapMethod(this.findByTicket.bind(this), 'findByTicket');
        this.findByUser = this.exceptionCatcher.wrapMethod(this.findByUser.bind(this), 'findByUser');
        this.findRecentActivity = this.exceptionCatcher.wrapMethod(this.findRecentActivity.bind(this), 'findRecentActivity');
    }

    protected toResponseDto(entity: TicketHistory): TicketHistoryResponseDto {
        return {
            uuid: entity.uuid,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            ticketUuid: entity.ticketUuid,
            userUuid: entity.userUuid,
            previousStatus: entity.previousStatus,
            newStatus: entity.newStatus,
            previousSeverity: entity.previousSeverity ?? null,
            newSeverity: entity.newSeverity ?? null,
            changeReason: entity.changeReason ?? null,
            previousTitle: entity.previousTitle,
            newTitle: entity.newTitle,
            previousDescription: entity.previousDescription,
            newDescription: entity.newDescription
        };
    }

    async update(uuid: string, updates: Partial<TicketHistoryRequestDto>): Promise<ServiceResponse<TicketHistoryResponseDto>> {
        throw new BadRequestError("The ticket history cannot be updated, only created")
    }

    async delete(uuid: string): Promise<ServiceResponse<TicketHistoryResponseDto>> {
        throw new BadRequestError("The ticket history cannot be deleted, only created")
    }

    protected toEntity(request: TicketHistoryRequestDto): TicketHistory {
        throw new ConflictError("The ticket history cannot be read from a json")
    }

    protected updateEntity(entity: TicketHistory, updates: Partial<TicketHistoryRequestDto>): TicketHistory {
        throw new BadRequestError("The ticket history cannot be updated, only created")
    }

    async create(request: TicketHistoryRequestDto): Promise<ServiceResponse<TicketHistoryResponseDto>> {
        const currentTicket = await this.ticketRepository.findByUuid(request.ticketUuid);
        const ticketHistory = new TicketHistory(
            currentTicket.uuid,
            request.userUuid,
            currentTicket.status,
            request.newStatus,
            currentTicket.severity,
            request.newSeverity,
            request.changeReason,
            currentTicket.title,
            request.newTitle,
            currentTicket.description,
            request.newDescription
        );
        ticketHistory.validate()
        const newHistory = await this.repository.create(ticketHistory);
        const responseDto = this.toResponseDto(newHistory);
        return new ServiceResponse(
            StatusCodes.CREATED,
            responseDto,
            `Entity ${responseDto.uuid} created successfully`
        );
    }

    async findByTicket(ticketUuid: string): Promise<ServiceResponse<Array<TicketHistoryResponseDto>>> {
        const histories = await this.repository.findByTicket(ticketUuid);
        const responseDtos = histories.map(this.toResponseDto);

        return new ServiceResponse(
            StatusCodes.OK,
            responseDtos,
            `Found ${responseDtos.length} history records for ticket ${ticketUuid}`
        );
    }

    async findByUser(userUuid: string): Promise<ServiceResponse<Array<TicketHistoryResponseDto>>> {
        const histories = await this.repository.findByUser(userUuid);
        const responseDtos = histories.map(this.toResponseDto);

        return new ServiceResponse(
            StatusCodes.OK,
            responseDtos,
            `Found ${responseDtos.length} history records for user ${userUuid}`
        );
    }

    async findRecentActivity(limit: number = 10): Promise<ServiceResponse<Array<TicketHistoryResponseDto>>> {
        const histories = await this.repository.findRecentActivity(limit);
        const responseDtos = histories.map(this.toResponseDto);

        return new ServiceResponse(
            StatusCodes.OK,
            responseDtos,
            `Retrieved ${responseDtos.length} recent ticket history records`
        );
    }
}

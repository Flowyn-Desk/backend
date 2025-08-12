import { StatusCodes } from 'http-status-codes';
import Papa from 'papaparse';
import { Ticket } from '../../domain/entities/Ticket.js';
import type { ITicketRepository } from '../../domain/repositories/ITicketRepository.js';
import type { ITicketHistoryService } from '../../domain/services/ITicketHistoryService.js';
import type { ITicketService } from '../../domain/services/ITicketService.js';
import { BaseService } from './BaseService.js';
import { ServiceResponse } from '../../domain/services/ServiceResponse.js';
import type { TicketRequestDto } from '../dto/ticket/TicketRequestDto.js';
import type { TicketResponseDto } from '../dto/ticket/TicketResponseDto.js';
import { TicketSeverity } from '../../domain/enums/TicketSeverity.js';
import { TicketStatus } from '../../domain/enums/TicketStatus.js';
import { ConflictError } from '../../shared/Errors/ConflictError.js';
import { BadRequestError } from '../../shared/Errors/BadRequestError.js';
import { ForbiddenError } from '../../shared/Errors/ForbiddenError.js';
import type { TicketHistoryResponseDto } from '../dto/ticket_history/TicketHistoryResponseDto.js';
import type { TicketHistoryRequestDto } from '../dto/ticket_history/TicketHistoryRequestDto.js'
import type { IAiService } from '../../domain/services/IAiService.js';

export class TicketService extends BaseService<
    Ticket,
    TicketRequestDto,
    TicketResponseDto,
    ITicketRepository
> implements ITicketService {

    private readonly ticketHistoryService: ITicketHistoryService;
    private readonly aiService: IAiService;

    constructor(
        repository: ITicketRepository,
        ticketHistoryService: ITicketHistoryService,
        aiService: IAiService
    ) {
        super(repository, 'TicketService');
        this.aiService = aiService;
        this.ticketHistoryService = ticketHistoryService;
        this.create = this.exceptionCatcher.wrapMethod(this.create.bind(this), 'create');
        this.getTicketByNumber = this.exceptionCatcher.wrapMethod(this.getTicketByNumber.bind(this), 'getTicketByNumber');
        this.getTicketsByStatus = this.exceptionCatcher.wrapMethod(this.getTicketsByStatus.bind(this), 'getTicketsByStatus');
        this.getTicketsByCreator = this.exceptionCatcher.wrapMethod(this.getTicketsByCreator.bind(this), 'getTicketsByCreator');
        this.getTicketsByWorkspace = this.exceptionCatcher.wrapMethod(this.getTicketsByWorkspace.bind(this), 'getTicketsByWorkspace');
        this.reviewTicket = this.exceptionCatcher.wrapMethod(this.reviewTicket.bind(this), 'reviewTicket');
        this.updateTicketDetails = this.exceptionCatcher.wrapMethod(this.updateTicketDetails.bind(this), 'updateTicketDetails');
        this.canUserReviewTicket = this.exceptionCatcher.wrapMethod(this.canUserReviewTicket.bind(this), 'canUserReviewTicket');
        this.suggestSeverity = this.exceptionCatcher.wrapMethod(this.suggestSeverity.bind(this), 'suggestSeverity');
        this.exportPendingTickets = this.exceptionCatcher.wrapMethod(this.exportPendingTickets.bind(this), 'exportPendingTickets');
        this.importTicketStatuses = this.exceptionCatcher.wrapMethod(this.importTicketStatuses.bind(this), 'importTicketStatuses');
        this.getTicketHistory = this.exceptionCatcher.wrapMethod(this.getTicketHistory.bind(this), 'getTicketHistory');
        this.exportTicketsToCsv = this.exceptionCatcher.wrapMethod(this.exportTicketsToCsv.bind(this), 'exportTicketsToCsv');
        this.updateCsvToTickets = this.exceptionCatcher.wrapMethod(this.updateCsvToTickets.bind(this), 'updateCsvToTickets');
    }

    protected toResponseDto(entity: Ticket): TicketResponseDto {
        return {
            uuid: entity.uuid,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            ticketNumber: entity.ticketNumber,
            workspaceUuid: entity.workspaceUuid,
            createdByUuid: entity.createdByUuid,
            title: entity.title,
            description: entity.description,
            severity: entity.severity,
            status: entity.status,
            severityChangeReason: entity.severityChangeReason ?? null,
            dueDate: entity.dueDate
        };
    }

    protected toEntity(request: TicketRequestDto): Ticket {
        return new Ticket(
            request.ticketNumber,
            request.workspaceUuid,
            request.createdByUuid,
            request.title,
            request.description,
            request.severity,
            request.status,
            request.dueDate,
            request.severityChangeReason ?? undefined
        );
    }

    protected updateEntity(entity: Ticket, updates: Partial<TicketRequestDto>): Ticket {
        if (updates.title !== undefined) entity.title = updates.title;
        if (updates.description !== undefined) entity.description = updates.description;
        if (updates.severity !== undefined) entity.severity = updates.severity;
        if (updates.status !== undefined) entity.status = updates.status;
        if (updates.severityChangeReason !== undefined) entity.severityChangeReason = updates.severityChangeReason;
        if (updates.dueDate !== undefined) entity.dueDate = updates.dueDate;

        return entity;
    }

    async create(request: TicketRequestDto): Promise<ServiceResponse<TicketResponseDto>> {
        const currentYear = new Date().getFullYear();
        const sequence = await this.repository.getNextSequenceNumber(currentYear, request.workspaceUuid);
        request.ticketNumber = Ticket.generateTicketNumber(currentYear, sequence);
        request.status = TicketStatus.DRAFT;

        const entity = this.toEntity(request);
        entity.validate();
        const createdEntity = await this.repository.create(entity);
        await this.createHistoryRecord(
            createdEntity.uuid,
            request.createdByUuid,
            request
        );


        const responseDto = this.toResponseDto(createdEntity);
        return new ServiceResponse(
            StatusCodes.CREATED,
            responseDto,
            `Ticket ${responseDto.ticketNumber} created successfully`
        );
    }

    async getAllByWorkspaceId(workspaceUuid: string): Promise<ServiceResponse<Array<TicketResponseDto>>> {
        if (!this.isValidUuid(workspaceUuid)) {
            throw new BadRequestError('Invalid creator UUID format');
        }
        const tickets = await this.repository.findAllByWorkspaceId(workspaceUuid);
        const responseDtos = tickets.map(ticket => this.toResponseDto(ticket));
        return new ServiceResponse(
            StatusCodes.OK,
            responseDtos,
            `Found ${responseDtos.length} from the workspace ${workspaceUuid}`
        );
    }

    async getTicketByNumber(ticketNumber: string): Promise<ServiceResponse<TicketResponseDto | null>> {
        if (!ticketNumber) {
            throw new BadRequestError('Ticket number is required');
        }
        const ticket = await this.repository.findByTicketNumber(ticketNumber);
        const responseDto = this.toResponseDto(ticket);
        return new ServiceResponse(
            StatusCodes.OK,
            responseDto,
            'Ticket retrieved successfully'
        );
    }

    async getTicketsByStatus(workspaceUuid: string, status: TicketStatus): Promise<ServiceResponse<TicketResponseDto[]>> {
        const tickets = await this.repository.findByStatus(workspaceUuid, status);
        const responseDtos = tickets.map(ticket => this.toResponseDto(ticket));

        return new ServiceResponse(
            StatusCodes.OK,
            responseDtos,
            `Found ${responseDtos.length} tickets with status ${status}`
        );
    }

    async getTicketsByCreator(createdByUuid: string): Promise<ServiceResponse<TicketResponseDto[]>> {
        if (!this.isValidUuid(createdByUuid)) {
            throw new BadRequestError('Invalid creator UUID format');
        }

        const tickets = await this.repository.findByCreatedBy(createdByUuid);
        const responseDtos = tickets.map(ticket => this.toResponseDto(ticket));

        return new ServiceResponse(
            StatusCodes.OK,
            responseDtos,
            `Found ${responseDtos.length} tickets created by user ${createdByUuid}`
        );
    }

    async getTicketsByWorkspace(workspaceUuid: string): Promise<ServiceResponse<TicketResponseDto[]>> {
        if (!this.isValidUuid(workspaceUuid)) {
            throw new BadRequestError('Invalid workspace UUID format');
        }

        const tickets = await this.repository.findByWorkspace(workspaceUuid);
        const responseDtos = tickets.map(ticket => this.toResponseDto(ticket));

        return new ServiceResponse(
            StatusCodes.OK,
            responseDtos,
            `Found ${responseDtos.length} tickets in workspace ${workspaceUuid}`
        );
    }

    async reviewTicket(
        ticketUuid: string,
        managerUuid: string,
        newSeverity: TicketSeverity,
        reason: string
    ): Promise<ServiceResponse<TicketResponseDto>> {
        if (!this.isValidUuid(ticketUuid) || !this.isValidUuid(managerUuid)) {
            throw new BadRequestError('Invalid UUID format');
        }
        const ticket = await this.repository.findByUuid(ticketUuid);
        const canReview = await this.canUserReviewTicket(ticketUuid, managerUuid);
        if (!canReview.payload) {
            throw new ForbiddenError('Manager cannot review their own tickets or ticket is not in DRAFT status');
        }

        const currentSeverity = ticket.severity;

        if (!reason) {
            throw new BadRequestError('Severity change reason is required when changing severity');
        }

        const newStatus = ticket.updateSeverity(newSeverity, reason, currentSeverity);
        ticket.status = newStatus;
        ticket.markUpdated();
        await this.createHistoryRecord(
            ticket.uuid,
            managerUuid,
            this.createTicketResquestDtoFromTicket(ticket)
        );
        const updatedTicket = await this.repository.update(ticketUuid, ticket);
        const responseDto = this.toResponseDto(updatedTicket);
        return new ServiceResponse(
            StatusCodes.OK,
            responseDto,
            `Ticket ${ticket.ticketNumber} reviewed successfully`
        );
    }

    async updateTicketDetails(
        ticketUuid: string,
        associateUuid: string,
        title?: string,
        description?: string
    ): Promise<ServiceResponse<TicketResponseDto>> {
        if (!this.isValidUuid(ticketUuid) || !this.isValidUuid(associateUuid)) {
            throw new BadRequestError('Invalid UUID format');
        }

        const ticket = await this.repository.findByUuid(ticketUuid);

        if (ticket.createdByUuid !== associateUuid) {
            throw new ForbiddenError('Only the ticket creator can update ticket details');
        }

        if (ticket.status !== TicketStatus.REVIEW) {
            throw new ConflictError('Ticket details can only be updated when ticket is in REVIEW status');
        }

        if (title) ticket.title = title;
        if (description) ticket.description = description;

        ticket.status = TicketStatus.DRAFT;
        ticket.markUpdated();

        await this.createHistoryRecord(
            ticket.uuid,
            associateUuid,
            this.createTicketResquestDtoFromTicket(ticket)
        );

        const updatedTicket = await this.repository.update(ticketUuid, ticket);
        const responseDto = this.toResponseDto(updatedTicket);

        return new ServiceResponse(
            StatusCodes.OK,
            responseDto,
            `Ticket ${ticket.ticketNumber} details updated successfully`
        );
    }

    async canUserReviewTicket(ticketUuid: string, managerUuid: string): Promise<ServiceResponse<boolean>> {
        if (!this.isValidUuid(ticketUuid) || !this.isValidUuid(managerUuid)) {
            throw new BadRequestError('Invalid UUID format');
        }

        const ticket = await this.repository.findByUuid(ticketUuid);

        const canReview = ticket.canBeReviewedBy(managerUuid);
        return new ServiceResponse(
            StatusCodes.OK,
            canReview,
            canReview ? 'Manager can review this ticket' : 'Manager cannot review this ticket'
        );
    }

    async suggestSeverity(title: string, description: string): Promise<ServiceResponse<TicketSeverity>> {
        return await this.aiService.suggestSeverity(title, description)
    }

    async exportPendingTickets(workspaceUuid: string): Promise<ServiceResponse<string>> {
        const pendingTicketsResponse = await this.getTicketsByStatus(workspaceUuid, TicketStatus.PENDING);
        const pendingTickets = pendingTicketsResponse.payload;

        if (pendingTickets.length === 0) {
            return new ServiceResponse(
                StatusCodes.OK,
                '',
                'No pending tickets to export'
            );
        }

        const ticketEntities = await Promise.all(
            pendingTickets.map(dto => this.repository.findByUuid(dto.uuid))
        );
        const validTickets = ticketEntities.filter((ticket): ticket is Ticket => ticket !== null);

        const csvResponse = await this.exportTicketsToCsv(validTickets);
        return csvResponse;
    }

    async importTicketStatuses(csvContent: string): Promise<ServiceResponse<void>> {
        const updatedTicketsResponse = await this.updateCsvToTickets(csvContent);

        return new ServiceResponse(
            StatusCodes.OK,
            undefined,
            `Successfully imported ${updatedTicketsResponse.payload.length} ticket status updates`
        );
    }

    async getTicketHistory(ticketUuid: string): Promise<ServiceResponse<Array<TicketHistoryResponseDto>>> {
        if (!this.isValidUuid(ticketUuid)) {
            throw new BadRequestError('Invalid ticket UUID format');
        }

        const historyResponse = await this.ticketHistoryService.findByTicket(ticketUuid);

        return new ServiceResponse(
            StatusCodes.OK,
            historyResponse.payload,
            `Retrieved ${historyResponse.payload.length} history records for ticket ${ticketUuid}`
        );
    }

    async exportTicketsToCsv(tickets: Ticket[]): Promise<ServiceResponse<string>> {
        if (tickets.length === 0) {
            return new ServiceResponse(StatusCodes.OK, '', 'No tickets to export');
        }
    
        const ticketsData = tickets.map(ticket => ({
            uuid: ticket.uuid,
            ticketNumber: ticket.ticketNumber,
            workspaceUuid: ticket.workspaceUuid,
            createdByUuid: ticket.createdByUuid,
            title: ticket.title,
            description: ticket.description,
            severity: ticket.severity,
            status: ticket.status,
            dueDate: ticket.dueDate.toISOString(),
            createdAt: ticket.createdAt.toISOString()
        }));
    
        const csvContent = Papa.unparse(ticketsData, {
            header: true,
            skipEmptyLines: true,
            delimiter: ',',
            quotes: false  // only quote when necessary
        });
    
        return new ServiceResponse(
            StatusCodes.OK,
            csvContent,
            `Exported ${tickets.length} tickets to CSV`
        );
    }
    
    async updateCsvToTickets(csvContent: string): Promise<ServiceResponse<Array<TicketResponseDto>>> {
        if (!csvContent.trim()) {
            throw new BadRequestError('CSV content cannot be empty');
        }
    
        const parseResult = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            delimiter: ',',   // expect comma
            transformHeader: h => h.trim(),
            dynamicTyping: false
        });
    
        if (parseResult.errors.length > 0) {
            throw new BadRequestError(`CSV parsing errors: ${parseResult.errors.map(e => e.message).join(', ')}`);
        }
    
        const csvData = parseResult.data as Array<Record<string, string>>;
    
        if (csvData.length === 0) {
            throw new BadRequestError('CSV must contain at least one data row');
        }
    
        const firstRow = csvData[0];
        if (!('uuid' in firstRow) || !('status' in firstRow)) {
            throw new BadRequestError('CSV must contain uuid and status columns');
        }
    
        const updatedTickets: TicketResponseDto[] = [];
    
        for (const row of csvData) {
            const ticketUuid = row.uuid?.trim();
            const newStatus = row.status?.trim() as TicketStatus;
    
            if (!ticketUuid || !newStatus) {
                continue;
            }
    
            if (!this.isValidUuid(ticketUuid)) {
                continue;
            }
    
            if (!Object.values(TicketStatus).includes(newStatus)) {
                continue;
            }
    
            try {
                const ticket = await this.repository.findByUuid(ticketUuid);
                if (!ticket || !ticket.active) {
                    continue;
                }
    
                const currentStatus = ticket.status;
                if (currentStatus !== newStatus) {
                    ticket.status = newStatus;
                    ticket.markUpdated();
    
                    const ticketRequest = this.createTicketResquestDtoFromTicket(ticket);
                    ticketRequest.severityChangeReason = 'Updated by CSV import';
                    await this.createHistoryRecord(
                        ticketUuid,
                        ticket.createdByUuid,
                        ticketRequest
                    );
    
                    const updatedTicket = await this.repository.update(ticketUuid, ticket);
                    updatedTickets.push(this.toResponseDto(updatedTicket));
                }
            } catch (error) {
                console.error(`Error updating ticket ${ticketUuid}:`, error);
                continue;
            }
        }
    
        return new ServiceResponse(
            StatusCodes.OK,
            updatedTickets,
            `Successfully updated ${updatedTickets.length} tickets from CSV import`
        );
    }
    
    private async createHistoryRecord(uuid: string, userUuid: string, request: TicketRequestDto): Promise<void> {
        const ticketHistory: TicketHistoryRequestDto = {
            ticketUuid: uuid,
            userUuid: userUuid,
            newStatus: request.status,
            newSeverity: request.severity,
            changeReason: request.severityChangeReason
        };
        await this.ticketHistoryService.create(ticketHistory);
    }

    private createTicketResquestDtoFromTicket(ticket: Ticket) {
        const ticketRequest: TicketRequestDto = {
            ticketNumber: ticket.ticketNumber,
            workspaceUuid: ticket.workspaceUuid,
            createdByUuid: ticket.createdByUuid,
            title: ticket.title,
            description: ticket.description,
            severity: ticket.severity,
            status: ticket.status,
            severityChangeReason: ticket.severityChangeReason || '',
            dueDate: ticket.dueDate
        };
        return ticketRequest;
    }
}
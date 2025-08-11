import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import Papa from 'papaparse';
import { TicketService } from '../../../src/application/services/TIcketService.ts';
import { Ticket } from '../../../src/domain/entities/Ticket.ts';
import { TicketSeverity } from '../../../src/domain/enums/TicketSeverity.ts';
import { TicketStatus } from '../../../src/domain/enums/TicketStatus.ts';
import { ServiceResponse } from '../../../src/domain/services/ServiceResponse.ts';

describe('TicketService', () => {
    let ticketRepositoryMock: any;
    let ticketHistoryServiceMock: any;
    let aiServiceMock: any;
    let service: TicketService;

    const mockTicketUuid = '86c570b8-4422-46de-9721-2f06d626488b';
    const mockWorkspaceUuid = 'c2e648c6-f78f-431c-b570-5b7d1976a40a';
    const mockCreatorUuid = 'b2041ee2-e19b-4a29-8a25-beca85e14eeb';
    const mockManagerUuid = 'a8e945c2-f123-4567-89ab-cdef12345678';

    const createMockTicketEntity = () => new Ticket(
        'TKT-2024-000001',
        mockWorkspaceUuid,
        mockCreatorUuid,
        'Initial Title',
        'Initial Description',
        TicketSeverity.LOW,
        TicketStatus.DRAFT,
        new Date('2024-12-31T00:00:00Z'),
        'Test Category',
        undefined,
        mockTicketUuid
    );

    beforeEach(() => {
        vi.clearAllMocks();

        const mockTicketEntity = createMockTicketEntity();

        ticketRepositoryMock = {
            getNextSequenceNumber: vi.fn().mockResolvedValue(1),
            create: vi.fn(),
            findByUuid: vi.fn().mockResolvedValue(mockTicketEntity),
            findAll: vi.fn().mockResolvedValue([mockTicketEntity]),
            update: vi.fn(),
            findByTicketNumber: vi.fn().mockResolvedValue(mockTicketEntity),
            findByStatus: vi.fn().mockResolvedValue([mockTicketEntity]),
            findByCreatedBy: vi.fn().mockResolvedValue([mockTicketEntity]),
            findByWorkspace: vi.fn().mockResolvedValue([mockTicketEntity]),
        };

        ticketHistoryServiceMock = {
            create: vi.fn().mockResolvedValue(new ServiceResponse(StatusCodes.CREATED, {}, 'History created')),
            findByTicket: vi.fn().mockResolvedValue(new ServiceResponse(StatusCodes.OK, [], 'History records found')),
        };

        aiServiceMock = {
            suggestSeverity: vi.fn().mockResolvedValue(new ServiceResponse(StatusCodes.OK, TicketSeverity.MEDIUM, 'Severity suggested')),
        };

        service = new TicketService(ticketRepositoryMock, ticketHistoryServiceMock, aiServiceMock);

        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('BaseService Methods', () => {
        it('getByUuid() should return a ticket when found', async () => {
            const mockTicketEntity = createMockTicketEntity();
            ticketRepositoryMock.findByUuid.mockResolvedValue(mockTicketEntity);
            const response = await service.getByUuid(mockTicketUuid);

            expect(ticketRepositoryMock.findByUuid).toHaveBeenCalledWith(mockTicketUuid);
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload).toEqual(service['toResponseDto'](mockTicketEntity));
        });

        it('getByUuid() should return NOT_FOUND when ticket is not found', async () => {
            ticketRepositoryMock.findByUuid.mockResolvedValue(null);
            const response = await service.getByUuid(mockTicketUuid);

            expect(response.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
            expect(response.payload).toBeNull();
            expect(response.message).toBe('Entity not found');
        });

        it('getByUuid() should return BadRequest for invalid UUID format', async () => {
            const invalidUuid = 'invalid-uuid-format';
            const response = await service.getByUuid(invalidUuid);
            expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.message).toBe('Invalid UUID format');
            expect(ticketRepositoryMock.findByUuid).not.toHaveBeenCalled();
        });

        it('getAll() should return all active tickets', async () => {
            const mockTicketEntity = createMockTicketEntity();
            const inactiveTicket = { ...mockTicketEntity, active: false };
            ticketRepositoryMock.findAll.mockResolvedValue([mockTicketEntity, inactiveTicket]);
            const response = await service.getAll();

            expect(ticketRepositoryMock.findAll).toHaveBeenCalled();
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload.length).toBe(1);
        });

        it('update() should successfully update a ticket', async () => {
            const mockTicketEntity = createMockTicketEntity();
            ticketRepositoryMock.findByUuid.mockResolvedValue(mockTicketEntity);
            const updates = { title: 'Updated Title' };
            const updatedEntity = { ...mockTicketEntity, title: 'Updated Title', markUpdated: vi.fn() };
            ticketRepositoryMock.update.mockResolvedValue(updatedEntity);

            const response = await service.update(mockTicketUuid, updates);

            expect(ticketRepositoryMock.findByUuid).toHaveBeenCalledWith(mockTicketUuid);
            expect(ticketRepositoryMock.update).toHaveBeenCalled();
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload.title).toBe('Updated Title');
        });

        it('update() should return NotFound when updating a non-existent ticket', async () => {
            ticketRepositoryMock.findByUuid.mockResolvedValue(null);
            const updates = { title: 'Updated Title' };
            const response = await service.update(mockTicketUuid, updates);
            expect(response.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
            expect(response.message).toBe('Entity not found or has been deleted');
        });

        it('delete() should successfully delete a ticket', async () => {
            const mockTicketEntity = createMockTicketEntity();
            ticketRepositoryMock.findByUuid.mockResolvedValue(mockTicketEntity);
            const deletedEntity = { ...mockTicketEntity, active: false };
            ticketRepositoryMock.update.mockResolvedValue(deletedEntity);

            const response = await service.delete(mockTicketUuid);

            expect(ticketRepositoryMock.findByUuid).toHaveBeenCalledWith(mockTicketUuid);
            expect(ticketRepositoryMock.update).toHaveBeenCalledWith(mockTicketUuid, expect.objectContaining({ active: false }));
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.message).toBe(`Entity ${mockTicketUuid} deleted successfully`);
        });

        it('delete() should return NotFound when deleting a non-existent ticket', async () => {
            ticketRepositoryMock.findByUuid.mockResolvedValue(null);
            const response = await service.delete(mockTicketUuid);
            expect(response.httpStatusCode).toBe(StatusCodes.NOT_FOUND);
            expect(response.message).toBe('Entity not found or already deleted');
        });
    });

    describe('TicketService Methods', () => {
        it('create() should create a new ticket with a generated number and history record', async () => {
            const requestDto = {
                workspaceUuid: mockWorkspaceUuid,
                createdByUuid: mockCreatorUuid,
                title: 'New Ticket',
                description: 'Problem description',
                severity: TicketSeverity.HIGH,
                dueDate: new Date(),
            };

            const createdEntity = { ...createMockTicketEntity(), uuid: 'new-uuid', ticketNumber: 'TKT-2024-000001', status: TicketStatus.DRAFT, createdAt: new Date() };
            ticketRepositoryMock.create.mockResolvedValue(createdEntity);

            const response = await service.create(requestDto as any);

            expect(ticketRepositoryMock.getNextSequenceNumber).toHaveBeenCalledWith(2024, mockWorkspaceUuid);
            expect(ticketRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                ticketNumber: 'TKT-2024-000001',
                status: TicketStatus.DRAFT,
            }));
            expect(ticketHistoryServiceMock.create).toHaveBeenCalled();
            expect(response.httpStatusCode).toBe(StatusCodes.CREATED);
            expect(response.payload.ticketNumber).toBe('TKT-2024-000001');
        });

        it('getTicketByNumber() should retrieve a ticket by its number', async () => {
            const mockTicketEntity = createMockTicketEntity();
            ticketRepositoryMock.findByTicketNumber.mockResolvedValue(mockTicketEntity);
            const response = await service.getTicketByNumber('TKT-2024-000001');

            expect(ticketRepositoryMock.findByTicketNumber).toHaveBeenCalledWith('TKT-2024-000001');
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload).toEqual(service['toResponseDto'](mockTicketEntity));
        });

        it('getTicketByNumber() should return BadRequest for missing ticket number', async () => {
            const response = await service.getTicketByNumber('');
            expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.message).toBe('Ticket number is required');
        });

        it('getTicketsByStatus() should return a list of tickets with a specific status', async () => {
            const mockTicketEntity = createMockTicketEntity();
            ticketRepositoryMock.findByStatus.mockResolvedValue([mockTicketEntity]);
            const response = await service.getTicketsByStatus(TicketStatus.DRAFT);

            expect(ticketRepositoryMock.findByStatus).toHaveBeenCalledWith(TicketStatus.DRAFT);
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload.length).toBe(1);
        });

        it('getTicketsByCreator() should return tickets for a given creator', async () => {
            const mockTicketEntity = createMockTicketEntity();
            ticketRepositoryMock.findByCreatedBy.mockResolvedValue([mockTicketEntity]);
            const response = await service.getTicketsByCreator(mockCreatorUuid);

            expect(ticketRepositoryMock.findByCreatedBy).toHaveBeenCalledWith(mockCreatorUuid);
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload.length).toBe(1);
        });

        it('getTicketsByCreator() should return BadRequest for invalid creator UUID', async () => {
            const invalidUuid = 'invalid-uuid';
            const response = await service.getTicketsByCreator(invalidUuid);
            expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.message).toBe('Invalid creator UUID format');
        });

        it('getTicketsByWorkspace() should return tickets for a given workspace', async () => {
            const mockTicketEntity = createMockTicketEntity();
            ticketRepositoryMock.findByWorkspace.mockResolvedValue([mockTicketEntity]);
            const response = await service.getTicketsByWorkspace(mockWorkspaceUuid);

            expect(ticketRepositoryMock.findByWorkspace).toHaveBeenCalledWith(mockWorkspaceUuid);
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload.length).toBe(1);
        });

        it('getTicketsByWorkspace() should return BadRequest for invalid workspace UUID', async () => {
            const invalidUuid = 'invalid-uuid';
            const response = await service.getTicketsByWorkspace(invalidUuid);
            expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.message).toBe('Invalid workspace UUID format');
        });

        it('reviewTicket() should successfully update a ticket and set status to PENDING when severity is not increased', async () => {
            const draftTicket = new Ticket(
                'TKT-2024-000001',
                mockWorkspaceUuid,
                mockCreatorUuid,
                'Initial Title',
                'Initial Description',
                TicketSeverity.MEDIUM,
                TicketStatus.DRAFT,
                new Date('2024-12-31T00:00:00Z'),
                'Test Category',
                undefined,
                mockTicketUuid,
            );
            ticketRepositoryMock.findByUuid.mockResolvedValue(draftTicket);
            vi.spyOn(service, 'canUserReviewTicket').mockResolvedValue(new ServiceResponse(StatusCodes.OK, true, ''));
            ticketRepositoryMock.update.mockResolvedValue({ ...draftTicket, status: TicketStatus.PENDING, severity: TicketSeverity.LOW });

            const response = await service.reviewTicket(mockTicketUuid, mockManagerUuid, TicketSeverity.LOW, 'Change reason');

            expect(ticketRepositoryMock.findByUuid).toHaveBeenCalledWith(mockTicketUuid);
            expect(ticketRepositoryMock.update).toHaveBeenCalled();
            expect(ticketHistoryServiceMock.create).toHaveBeenCalled();
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload.status).toBe(TicketStatus.PENDING);
            expect(response.payload.severity).toBe(TicketSeverity.LOW);
        });

        it('reviewTicket() should successfully update a ticket and set status to REVIEW when severity is increased', async () => {
            const draftTicket = new Ticket(
                'TKT-2024-000001',
                mockWorkspaceUuid,
                mockCreatorUuid,
                'Initial Title',
                'Initial Description',
                TicketSeverity.LOW,
                TicketStatus.DRAFT,
                new Date('2024-12-31T00:00:00Z'),
                'Test Category',
                undefined,
                mockTicketUuid,
            );
            ticketRepositoryMock.findByUuid.mockResolvedValue(draftTicket);
            vi.spyOn(service, 'canUserReviewTicket').mockResolvedValue(new ServiceResponse(StatusCodes.OK, true, ''));
            ticketRepositoryMock.update.mockResolvedValue({ ...draftTicket, status: TicketStatus.REVIEW, severity: TicketSeverity.HIGH });

            const response = await service.reviewTicket(mockTicketUuid, mockManagerUuid, TicketSeverity.HIGH, 'Change reason');

            expect(ticketRepositoryMock.findByUuid).toHaveBeenCalledWith(mockTicketUuid);
            expect(ticketRepositoryMock.update).toHaveBeenCalled();
            expect(ticketHistoryServiceMock.create).toHaveBeenCalled();
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload.status).toBe(TicketStatus.REVIEW);
            expect(response.payload.severity).toBe(TicketSeverity.HIGH);
        });

        it('reviewTicket() should return ForbiddenError if user cannot review', async () => {
            vi.spyOn(service, 'canUserReviewTicket').mockResolvedValue(new ServiceResponse(StatusCodes.OK, false, 'Manager cannot review their own tickets or ticket is not in DRAFT status'));
            const response = await service.reviewTicket(mockTicketUuid, mockCreatorUuid, TicketSeverity.MEDIUM, 'Reason');
            expect(response.httpStatusCode).toBe(StatusCodes.FORBIDDEN);
            expect(response.message).toBe('Manager cannot review their own tickets or ticket is not in DRAFT status');
        });

        it('reviewTicket() should return BadRequestError if reason is missing for severity change', async () => {
            const draftTicket = new Ticket(
                'TKT-2024-000001',
                mockWorkspaceUuid,
                mockCreatorUuid,
                'Initial Title',
                'Initial Description',
                TicketSeverity.LOW,
                TicketStatus.DRAFT,
                new Date('2024-12-31T00:00:00Z'),
                'Test Category',
                undefined,
                mockTicketUuid,
            );
            ticketRepositoryMock.findByUuid.mockResolvedValue(draftTicket);
            vi.spyOn(service, 'canUserReviewTicket').mockResolvedValue(new ServiceResponse(StatusCodes.OK, true, ''));

            const response = await service.reviewTicket(mockTicketUuid, mockManagerUuid, TicketSeverity.HIGH, '');
            expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.message).toBe('Severity change reason is required when changing severity');
        });

        it('updateTicketDetails() should successfully update ticket details', async () => {
            const reviewTicket = new Ticket(
                'TKT-2024-000001',
                mockWorkspaceUuid,
                mockCreatorUuid,
                'Initial Title',
                'Initial Description',
                TicketSeverity.LOW,
                TicketStatus.REVIEW,
                new Date('2024-12-31T00:00:00Z'),
                'Test Category',
                mockTicketUuid,
            );
            ticketRepositoryMock.findByUuid.mockResolvedValue(reviewTicket);
            ticketRepositoryMock.update.mockResolvedValue({ ...reviewTicket, status: TicketStatus.DRAFT, title: 'New Title' });

            const response = await service.updateTicketDetails(mockTicketUuid, mockCreatorUuid, 'New Title', 'New Description');

            expect(ticketRepositoryMock.findByUuid).toHaveBeenCalledWith(mockTicketUuid);
            expect(ticketRepositoryMock.update).toHaveBeenCalled();
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload.title).toBe('New Title');
            expect(response.payload.status).toBe(TicketStatus.DRAFT);
        });

        it('updateTicketDetails() should return ForbiddenError if not the creator', async () => {
            const mockTicketEntity = createMockTicketEntity();
            const reviewTicket = { ...mockTicketEntity, createdByUuid: 'other-user', status: TicketStatus.REVIEW };
            ticketRepositoryMock.findByUuid.mockResolvedValue(reviewTicket);

            const response = await service.updateTicketDetails(mockTicketUuid, mockCreatorUuid, 'New Title');
            expect(response.httpStatusCode).toBe(StatusCodes.FORBIDDEN);
            expect(response.message).toBe('Only the ticket creator can update ticket details');
        });

        it('updateTicketDetails() should return ConflictError if not in REVIEW status', async () => {
            const mockTicketEntity = createMockTicketEntity();
            const draftTicket = { ...mockTicketEntity, createdByUuid: mockCreatorUuid, status: TicketStatus.DRAFT };
            ticketRepositoryMock.findByUuid.mockResolvedValue(draftTicket);

            const response = await service.updateTicketDetails(mockTicketUuid, mockCreatorUuid, 'New Title');
            expect(response.httpStatusCode).toBe(StatusCodes.CONFLICT);
            expect(response.message).toBe('Ticket details can only be updated when ticket is in REVIEW status');
        });

        it('canUserReviewTicket() should return true when user can review', async () => {
            const mockTicketEntity = createMockTicketEntity();
            ticketRepositoryMock.findByUuid.mockResolvedValue(mockTicketEntity);
            const response = await service.canUserReviewTicket(mockTicketUuid, mockManagerUuid);
            expect(response.payload).toBe(true);
        });

        it('canUserReviewTicket() should return false when user is the creator', async () => {
            const mockTicketEntity = createMockTicketEntity();
            ticketRepositoryMock.findByUuid.mockResolvedValue(mockTicketEntity);
            const response = await service.canUserReviewTicket(mockTicketUuid, mockCreatorUuid);
            expect(response.payload).toBe(false);
        });

        it('suggestSeverity() should call the AI service and return the suggestion', async () => {
            const response = await service.suggestSeverity('title', 'description');

            expect(aiServiceMock.suggestSeverity).toHaveBeenCalledWith('title', 'description');
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload).toBe(TicketSeverity.MEDIUM);
        });

        it('exportPendingTickets() should export a CSV of pending tickets', async () => {
            const mockTicketEntity = createMockTicketEntity();
            // @ts-ignore
            const pendingTicketDto = service['toResponseDto']({ ...mockTicketEntity, status: TicketStatus.PENDING });
            vi.spyOn(service, 'getTicketsByStatus').mockResolvedValue(new ServiceResponse(StatusCodes.OK, [pendingTicketDto], ''));
            vi.spyOn(service, 'exportTicketsToCsv').mockResolvedValue(new ServiceResponse(StatusCodes.OK, 'csv content', ''));

            const response = await service.exportPendingTickets();

            expect(service.getTicketsByStatus).toHaveBeenCalledWith(TicketStatus.PENDING);
            expect(service.exportTicketsToCsv).toHaveBeenCalled();
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload).toBe('csv content');
        });

        it('exportPendingTickets() should return an empty CSV with no pending tickets', async () => {
            vi.spyOn(service, 'getTicketsByStatus').mockResolvedValue(new ServiceResponse(StatusCodes.OK, [], ''));

            const response = await service.exportPendingTickets();

            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload).toBe('');
            expect(response.message).toBe('No pending tickets to export');
        });

        it('importTicketStatuses() should successfully import ticket statuses', async () => {
            const mockTicketEntity = createMockTicketEntity();
            vi.spyOn(service, 'updateCsvToTickets').mockResolvedValue(new ServiceResponse(StatusCodes.OK, [service['toResponseDto'](mockTicketEntity)], ''));
            const csvContent = 'uuid,status\n...';

            const response = await service.importTicketStatuses(csvContent);

            expect(service.updateCsvToTickets).toHaveBeenCalledWith(csvContent);
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.message).toContain('Successfully imported');
        });

        it('getTicketHistory() should retrieve history for a ticket', async () => {
            const historyResponseDto = [{ uuid: 'hist-uuid' }] as any;
            ticketHistoryServiceMock.findByTicket.mockResolvedValue(new ServiceResponse(StatusCodes.OK, historyResponseDto, ''));

            const response = await service.getTicketHistory(mockTicketUuid);

            expect(ticketHistoryServiceMock.findByTicket).toHaveBeenCalledWith(mockTicketUuid);
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload.length).toBe(1);
        });

        it('getTicketHistory() should return BadRequest for invalid UUID', async () => {
            const invalidUuid = 'invalid-uuid';
            const response = await service.getTicketHistory(invalidUuid);
            expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.message).toBe('Invalid ticket UUID format');
        });

        it('exportTicketsToCsv() should return a CSV string for a list of tickets', async () => {
            const mockTicketEntity = createMockTicketEntity();
            const mockTickets = [mockTicketEntity];
            vi.spyOn(Papa, 'unparse').mockReturnValue('uuid,ticketNumber\n...csv content...');

            const response = await service.exportTicketsToCsv(mockTickets);

            expect(Papa.unparse).toHaveBeenCalledWith(expect.any(Array), expect.any(Object));
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload).toBe('uuid,ticketNumber\n...csv content...');
        });

        it('exportTicketsToCsv() should handle an empty ticket list', async () => {
            vi.spyOn(Papa, 'unparse').mockReturnValue('');
            const response = await service.exportTicketsToCsv([]);
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
            expect(response.payload).toBe('');
            expect(response.message).toBe('No tickets to export');
        });

        it('updateCsvToTickets() should update tickets from a valid CSV', async () => {
            const csvContent = 'uuid,status\n' +
                `${mockTicketUuid},${TicketStatus.REVIEW}\n`;
            const parsedData = [{ uuid: mockTicketUuid, status: TicketStatus.REVIEW }];
            vi.spyOn(Papa, 'parse').mockReturnValue({ data: parsedData, errors: [], meta: {} } as any);

            const mockTicketEntity = createMockTicketEntity();
            const updatedTicket = { ...mockTicketEntity, status: TicketStatus.REVIEW };
            ticketRepositoryMock.findByUuid.mockResolvedValue(mockTicketEntity);
            ticketRepositoryMock.update.mockResolvedValue(updatedTicket);

            const response = await service.updateCsvToTickets(csvContent);

            expect(Papa.parse).toHaveBeenCalledWith(csvContent, expect.any(Object));
            expect(ticketRepositoryMock.findByUuid).toHaveBeenCalledWith(mockTicketUuid);
            expect(ticketRepositoryMock.update).toHaveBeenCalledWith(mockTicketUuid, expect.objectContaining({ status: TicketStatus.REVIEW }));
            expect(ticketHistoryServiceMock.create).toHaveBeenCalled();
            expect(response.payload.length).toBe(1);
            expect(response.httpStatusCode).toBe(StatusCodes.OK);
        });

        it('updateCsvToTickets() should return BadRequest for empty CSV content', async () => {
            const response = await service.updateCsvToTickets('');
            expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.message).toBe('CSV content cannot be empty');
        });

        it('updateCsvToTickets() should return BadRequest for a CSV with parsing errors', async () => {
            const csvContent = 'invalid,csv';
            vi.spyOn(Papa, 'parse').mockReturnValue({ data: [], errors: [{ message: 'Bad format' }] as any, meta: {} } as any);
            const response = await service.updateCsvToTickets(csvContent);
            expect(response.httpStatusCode).toBe(StatusCodes.BAD_REQUEST);
            expect(response.message).toContain('CSV parsing errors');
        });

        it('updateCsvToTickets() should skip invalid rows gracefully', async () => {
            const csvContent = 'uuid,status\n' +
                'invalid-uuid,DRAFT\n' + // Invalid UUID
                `${mockTicketUuid},INVALID_STATUS\n`; // Invalid status
            const parsedData = [
                { uuid: 'invalid-uuid', status: 'DRAFT' },
                { uuid: mockTicketUuid, status: 'INVALID_STATUS' }
            ];
            vi.spyOn(Papa, 'parse').mockReturnValue({ data: parsedData, errors: [], meta: {} } as any);

            const response = await service.updateCsvToTickets(csvContent);

            expect(response.payload.length).toBe(0);
            expect(ticketRepositoryMock.findByUuid).not.toHaveBeenCalled();
        });
    });
});

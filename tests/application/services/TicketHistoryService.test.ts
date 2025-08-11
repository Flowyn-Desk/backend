import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketHistoryService } from '../../../src/application/services/TicketHistoryService.js';
import { TicketHistory } from '../../../src/domain/entities/TicketHistory.js';
import { TicketSeverity } from '../../../src/domain/enums/TicketSeverity.js';
import { TicketStatus } from '../../../src/domain/enums/TicketStatus.js';
import { StatusCodes } from 'http-status-codes';

describe('TicketHistoryService', () => {
  let ticketHistoryRepoMock: any;
  let ticketRepoMock: any;
  let service: TicketHistoryService;

  const fakeTicket = {
    uuid: '86c570b8-4422-46de-9721-2f06d626488b',
    status: TicketStatus.DRAFT,
    severity: TicketSeverity.LOW,
  };

  beforeEach(() => {
    ticketHistoryRepoMock = {
      create: vi.fn(),
      findByTicket: vi.fn(),
      findByUser: vi.fn(),
      findRecentActivity: vi.fn(),
    };

    ticketRepoMock = {
      findByUuid: vi.fn(),
    };

    service = new TicketHistoryService(ticketHistoryRepoMock, ticketRepoMock);
  });

  it('create() should create a TicketHistory and return response DTO', async () => {
    ticketRepoMock.findByUuid.mockResolvedValue(fakeTicket);

    const request = {
      ticketUuid: '86c570b8-4422-46de-9721-2f06d626488b',
      userUuid: 'b2041ee2-e19b-4a29-8a25-beca85e14eeb',
      newStatus: TicketStatus.REVIEW,
      newSeverity: TicketSeverity.HIGH,
      changeReason: 'Severity upgraded',
    };

    const createdEntity = new TicketHistory(
      fakeTicket.uuid,
      request.userUuid,
      fakeTicket.status,
      request.newStatus,
      fakeTicket.severity,
      request.newSeverity,
      request.changeReason
    );

    ticketHistoryRepoMock.create.mockResolvedValue(createdEntity);

    const response = await service.create(request);

    expect(ticketRepoMock.findByUuid).toHaveBeenCalledWith('86c570b8-4422-46de-9721-2f06d626488b');
    expect(ticketHistoryRepoMock.create).toHaveBeenCalled();
    expect(response.httpStatusCode).toBe(StatusCodes.CREATED);
    expect(response.payload.ticketUuid).toBe('86c570b8-4422-46de-9721-2f06d626488b');
    expect(response.payload.userUuid).toBe('b2041ee2-e19b-4a29-8a25-beca85e14eeb');
    expect(response.payload.previousStatus).toBe(TicketStatus.DRAFT);
    expect(response.payload.newStatus).toBe(TicketStatus.REVIEW);
    expect(response.payload.previousSeverity).toBe(TicketSeverity.LOW);
    expect(response.payload.newSeverity).toBe(TicketSeverity.HIGH);
    expect(response.payload.changeReason).toBe('Severity upgraded');
  });

  it('findByTicket() returns active histories as response DTOs', async () => {
    const histories = [
      new TicketHistory(
        '86c570b8-4422-46de-9721-2f06d626488b',
        'b2041ee2-e19b-4a29-8a25-beca85e14eeb',
        TicketStatus.DRAFT,
        TicketStatus.REVIEW,
        TicketSeverity.LOW,
        TicketSeverity.MEDIUM,
        'Reason 1',
        'uuid1'
      ),
      new TicketHistory(
        '86c570b8-4422-46de-9721-2f06d626488b',
        'user2-uuid',
        TicketStatus.REVIEW,
        TicketStatus.CLOSED,
        TicketSeverity.MEDIUM,
        TicketSeverity.HIGH,
        'Reason 2',
        'uuid2'
      ),
    ];
    // @ts-ignore
    histories[1].active = false;

    ticketHistoryRepoMock.findByTicket.mockResolvedValue(histories);

    const response = await service.findByTicket('86c570b8-4422-46de-9721-2f06d626488b');

    expect(ticketHistoryRepoMock.findByTicket).toHaveBeenCalledWith('86c570b8-4422-46de-9721-2f06d626488b');
    expect(response.httpStatusCode).toBe(200);
    expect(response.payload.length).toBe(1);
    // @ts-ignore
    expect(response.payload[0].uuid).toBe('uuid1');
  });

  it('findByUser() returns active histories as response DTOs', async () => {
    const histories = [
      new TicketHistory(
        '86c570b8-4422-46de-9721-2f06d626488b',
        'b2041ee2-e19b-4a29-8a25-beca85e14eeb',
        TicketStatus.DRAFT,
        TicketStatus.REVIEW,
        TicketSeverity.LOW,
        TicketSeverity.MEDIUM,
        'Reason 1',
        'uuid1'
      ),
      new TicketHistory(
        '86c570b8-4422-46de-9721-2f06d626488b',
        'b2041ee2-e19b-4a29-8a25-beca85e14eeb',
        TicketStatus.REVIEW,
        TicketStatus.CLOSED,
        TicketSeverity.MEDIUM,
        TicketSeverity.HIGH,
        'Reason 2',
        'uuid2'
      ),
    ];
    // @ts-ignore
    histories[1].active = false;

    ticketHistoryRepoMock.findByUser.mockResolvedValue(histories);

    const response = await service.findByUser('b2041ee2-e19b-4a29-8a25-beca85e14eeb');

    expect(ticketHistoryRepoMock.findByUser).toHaveBeenCalledWith('b2041ee2-e19b-4a29-8a25-beca85e14eeb');
    expect(response.httpStatusCode).toBe(200);
    expect(response.payload.length).toBe(1);
    // @ts-ignore
    expect(response.payload[0].uuid).toBe('uuid1');
  });

  it('findRecentActivity() returns active recent histories', async () => {
    const histories = [
      new TicketHistory(
        '86c570b8-4422-46de-9721-2f06d626488b',
        'b2041ee2-e19b-4a29-8a25-beca85e14eeb',
        TicketStatus.DRAFT,
        TicketStatus.REVIEW,
        TicketSeverity.LOW,
        TicketSeverity.MEDIUM,
        'Reason 1',
        'uuid1'
      ),
      new TicketHistory(
        '86c570b8-4422-46de-9721-2f06d626488b',
        'user2-uuid',
        TicketStatus.REVIEW,
        TicketStatus.CLOSED,
        TicketSeverity.MEDIUM,
        TicketSeverity.HIGH,
        'Reason 2',
        'uuid2'
      ),
    ];
    // @ts-ignore
    histories[1].active = false;

    ticketHistoryRepoMock.findRecentActivity.mockResolvedValue(histories);

    const response = await service.findRecentActivity(10);

    expect(ticketHistoryRepoMock.findRecentActivity).toHaveBeenCalledWith(10);
    expect(response.httpStatusCode).toBe(200);
    expect(response.payload.length).toBe(1);
    // @ts-ignore
    expect(response.payload[0].uuid).toBe('uuid1');
  });
});

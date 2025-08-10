import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TicketHistoryRepository } from '../../../../src/application/infrastructure/database/TicketHistoryRepository.ts';
import { TicketSeverity, TicketStatus } from '../../../../generated/prisma/index.js';
import { TicketHistory } from '../../../../src/domain/entities/TicketHistory.ts';

describe('TicketHistoryRepository', () => {
  let prismaMock: any;
  let repository: TicketHistoryRepository;

  const sampleRecord = {
    uuid: 'hist-uuid',
    ticketUuid: 'ticket-uuid',
    userUuid: 'user-uuid',
    previousStatus: TicketStatus.DRAFT,
    newStatus: TicketStatus.REVIEW,
    previousSeverity: TicketSeverity.LOW,
    newSeverity: TicketSeverity.HIGH,
    changeReason: 'Updated status and severity',
    timestamp: new Date('2025-08-10T12:00:00Z'),
    createdAt: new Date('2025-08-09T12:00:00Z'),
    updatedAt: new Date('2025-08-09T12:00:00Z'),
    deletedAt: null,
    active: true,
  };

  beforeEach(() => {
    prismaMock = {
      ticketHistory: {
        findMany: vi.fn(),
      },
    };
    repository = new TicketHistoryRepository(prismaMock);
  });

  it('should map record to TicketHistory entity', () => {
    const entity = repository['mapToEntity'](sampleRecord);
    expect(entity).toBeInstanceOf(TicketHistory);
    expect(entity.ticketUuid).toBe(sampleRecord.ticketUuid);
    expect(entity.previousStatus).toBe(TicketStatus.DRAFT);
    expect(entity.newSeverity).toBe(TicketSeverity.HIGH);
  });

  it('findByTicket should return mapped entities', async () => {
    prismaMock.ticketHistory.findMany.mockResolvedValue([sampleRecord]);

    const results = await repository.findByTicket('ticket-uuid');

    expect(prismaMock.ticketHistory.findMany).toHaveBeenCalledWith({
      where: { ticketUuid: 'ticket-uuid', active: true },
      orderBy: { timestamp: 'desc' },
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toBeInstanceOf(TicketHistory);
    // @ts-ignore
    expect(results[0].userUuid).toBe('user-uuid');
  });

  it('findByUser should return mapped entities', async () => {
    prismaMock.ticketHistory.findMany.mockResolvedValue([sampleRecord]);

    const results = await repository.findByUser('user-uuid');

    expect(prismaMock.ticketHistory.findMany).toHaveBeenCalledWith({
      where: { userUuid: 'user-uuid', active: true },
      orderBy: { timestamp: 'desc' },
    });
    const obtainedTicketHistory = results[0]
    // @ts-ignore
    expect(obtainedTicketHistory.ticketUuid).toBe('ticket-uuid');
  });

  it('findRecentActivity should return limited mapped entities', async () => {
    prismaMock.ticketHistory.findMany.mockResolvedValue([sampleRecord]);

    const results = await repository.findRecentActivity(5);

    expect(prismaMock.ticketHistory.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });
    expect(results).toHaveLength(1);
    const obtainedTicketHistory = results[0]
    expect(obtainedTicketHistory).toBeInstanceOf(TicketHistory);
  });

  it('findRecentActivity should default to limit 10', async () => {
    prismaMock.ticketHistory.findMany.mockResolvedValue([sampleRecord]);

    await repository.findRecentActivity();

    expect(prismaMock.ticketHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10 })
    );
  });
});

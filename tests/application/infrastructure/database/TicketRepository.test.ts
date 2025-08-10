import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Ticket } from '../../../../src/domain/entities/Ticket.js';
import { TicketStatus } from '../../../../src/domain/enums/TicketStatus.js';
import { TicketRepository } from '../../../../src/application/infrastructure/database/TicketRepository.ts';

describe('TicketRepository', () => {
  let prismaMock: any;
  let repo: TicketRepository;

  beforeEach(() => {
    prismaMock = {
      ticket: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        updateMany: vi.fn(),
      },
    };
    repo = new TicketRepository(prismaMock);
  });

  it('should map records to Ticket entities', async () => {
    const record = {
      uuid: 'uuid-1',
      ticketNumber: 'TKT-2025-000001',
      workspaceUuid: 'ws-1',
      createdByUuid: 'user-1',
      title: 'Test',
      description: 'Desc',
      category: 'Bug',
      severity: 'HIGH',
      status: TicketStatus.PENDING,
      severityChangeReason: null,
      dueDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      active: true,
    };
    prismaMock.ticket.findMany.mockResolvedValue([record]);

    const result = await repo.findByStatus(TicketStatus.PENDING);

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(Ticket);
    // @ts-ignore
    expect(result[0].ticketNumber).toBe('TKT-2025-000001');
  });

  it('findByCreatedBy should call prisma with correct filter', async () => {
    prismaMock.ticket.findMany.mockResolvedValue([]);
    await repo.findByCreatedBy('creator-uuid');
    expect(prismaMock.ticket.findMany).toHaveBeenCalledWith({
      where: { createdByUuid: 'creator-uuid', active: true },
    });
  });

  it('findByWorkspace should return mapped Tickets', async () => {
    prismaMock.ticket.findMany.mockResolvedValue([]);
    const result = await repo.findByWorkspace('ws-uuid');
    expect(result).toEqual([]);
  });

  it('findPendingTickets should filter by PENDING status', async () => {
    prismaMock.ticket.findMany.mockResolvedValue([]);
    await repo.findPendingTickets();
    expect(prismaMock.ticket.findMany).toHaveBeenCalledWith({
      where: { status: TicketStatus.PENDING, active: true },
    });
  });

  it('findByTicketNumber should return a Ticket or null', async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({ uuid: 'abc', ticketNumber: 'TKT-2025-000001' });
    const ticket = await repo.findByTicketNumber('TKT-2025-000001');
    expect(ticket).toBeInstanceOf(Ticket);

    prismaMock.ticket.findFirst.mockResolvedValue(null);
    const nullTicket = await repo.findByTicketNumber('unknown');
    expect(nullTicket).toBeNull();
  });

  it('getNextSequenceNumber should return 1 if no tickets exist', async () => {
    prismaMock.ticket.findFirst.mockResolvedValue(null);
    const seq = await repo.getNextSequenceNumber(2025, 'ws-uuid');
    expect(seq).toBe(1);
  });

  it('getNextSequenceNumber should increment last sequence', async () => {
    prismaMock.ticket.findFirst.mockResolvedValue({ ticketNumber: 'TKT-2025-000005' });
    const seq = await repo.getNextSequenceNumber(2025, 'ws-uuid');
    expect(seq).toBe(6);
  });

  it('findByStatusAndWorkspace should filter by status and workspace', async () => {
    prismaMock.ticket.findMany.mockResolvedValue([]);
    await repo.findByStatusAndWorkspace(TicketStatus.DRAFT, 'ws-uuid');
    expect(prismaMock.ticket.findMany).toHaveBeenCalledWith({
      where: { status: TicketStatus.DRAFT, workspaceUuid: 'ws-uuid', active: true },
    });
  });

  it('bulkUpdateStatus should update and return mapped Tickets', async () => {
    const ticketRecords = [{ uuid: 't1', ticketNumber: 'TKT-2025-000001' }];
    prismaMock.ticket.findMany.mockResolvedValue(ticketRecords);
    prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });

    const result = await repo.bulkUpdateStatus(['t1'], TicketStatus.CLOSED);
    expect(prismaMock.ticket.updateMany).toHaveBeenCalled();
    expect(result[0]).toBeInstanceOf(Ticket);
  });
});
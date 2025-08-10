import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { TicketHistory } from '../../src/domain/entities/TicketHistory.js';
import { TicketSeverity } from '../../src/domain/enums/TicketSeverity.js';
import { TicketStatus } from '../../src/domain/enums/TicketStatus.js';

describe('TicketHistory entity basic test', () => {
  it('should create a TicketHistory instance with required properties', () => {
    const timestamp = new Date('2025-08-10T12:00:00Z');
    const history = new TicketHistory(
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      TicketStatus.DRAFT,
      TicketStatus.REVIEW,
      timestamp
    );

    expect(history.ticketUuid).toBe('11111111-1111-1111-1111-111111111111');
    expect(history.userUuid).toBe('22222222-2222-2222-2222-222222222222');
    expect(history.previousStatus).toBe(TicketStatus.DRAFT);
    expect(history.newStatus).toBe(TicketStatus.REVIEW);
    expect(history.timestamp).toBe(timestamp);
    expect(history.previousSeverity).toBeUndefined();
    expect(history.newSeverity).toBeUndefined();
    expect(history.changeReason).toBeUndefined();
  });

  it('should create a TicketHistory with all optional properties set', () => {
    const timestamp = new Date();
    const history = new TicketHistory(
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      TicketStatus.PENDING,
      TicketStatus.CLOSED,
      timestamp,
      TicketSeverity.LOW,
      TicketSeverity.HIGH,
      'Severity increased due to customer impact'
    );

    expect(history.previousSeverity).toBe(TicketSeverity.LOW);
    expect(history.newSeverity).toBe(TicketSeverity.HIGH);
    expect(history.changeReason).toBe('Severity increased due to customer impact');
  });
});

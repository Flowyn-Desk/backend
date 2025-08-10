import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';
import { validate } from 'class-validator';
import { Ticket } from '../../src/domain/entities/Ticket.js';
import { TicketSeverity } from '../../src/domain/enums/TicketSeverity.js';
import { TicketStatus } from '../../src/domain/enums/TicketStatus.js';

describe('Ticket Entity', () => {
    const validTicketData = {
        ticketNumber: 'TKT-2024-000001',
        workspaceUuid: '550e8400-e29b-41d4-a716-446655440000',
        createdByUuid: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Test Ticket',
        description: 'This is a test ticket description',
        severity: TicketSeverity.MEDIUM,
        status: TicketStatus.DRAFT,
        dueDate: new Date('2024-12-31'),
        category: 'Bug',
        severityChangeReason: 'Initial severity assessment'
    };

    describe('Constructor', () => {
        it('should create a ticket with all required fields', () => {
            const ticket = new Ticket(
                validTicketData.ticketNumber,
                validTicketData.workspaceUuid,
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                validTicketData.severity,
                validTicketData.status,
                validTicketData.dueDate
            );

            expect(ticket.ticketNumber).toBe(validTicketData.ticketNumber);
            expect(ticket.workspaceUuid).toBe(validTicketData.workspaceUuid);
            expect(ticket.createdByUuid).toBe(validTicketData.createdByUuid);
            expect(ticket.title).toBe(validTicketData.title);
            expect(ticket.description).toBe(validTicketData.description);
            expect(ticket.severity).toBe(validTicketData.severity);
            expect(ticket.status).toBe(validTicketData.status);
            expect(ticket.dueDate).toBe(validTicketData.dueDate);
            expect(ticket.category).toBeUndefined();
            expect(ticket.severityChangeReason).toBeUndefined();
        });

        it('should create a ticket with optional fields', () => {
            const ticket = new Ticket(
                validTicketData.ticketNumber,
                validTicketData.workspaceUuid,
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                validTicketData.severity,
                validTicketData.status,
                validTicketData.dueDate,
                validTicketData.category,
                validTicketData.severityChangeReason
            );

            expect(ticket.category).toBe(validTicketData.category);
            expect(ticket.severityChangeReason).toBe(validTicketData.severityChangeReason);
        });

        it('should inherit from BaseEntity and set base properties', () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440002';
            const createdAt = new Date('2024-01-01');
            const updatedAt = new Date('2024-01-02');
            const deletedAt = new Date('2024-01-03');
            const active = false;

            const ticket = new Ticket(
                validTicketData.ticketNumber,
                validTicketData.workspaceUuid,
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                validTicketData.severity,
                validTicketData.status,
                validTicketData.dueDate,
                undefined,
                undefined,
                uuid,
                createdAt,
                updatedAt,
                deletedAt,
                active
            );

            expect(ticket.uuid).toBe(uuid);
            expect(ticket.createdAt).toBe(createdAt);
            expect(ticket.updatedAt).toBe(updatedAt);
            expect(ticket.deletedAt).toBe(deletedAt);
            expect(ticket.active).toBe(active);
        });
    });

    describe('Validation', () => {
        it('should pass validation with valid data', async () => {
            const ticket = new Ticket(
                validTicketData.ticketNumber,
                validTicketData.workspaceUuid,
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                validTicketData.severity,
                validTicketData.status,
                validTicketData.dueDate,
                validTicketData.category,
                validTicketData.severityChangeReason
            );

            const errors = await validate(ticket);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation with invalid ticketNumber (not string)', async () => {
            const ticket = new Ticket(
                123 as any,
                validTicketData.workspaceUuid,
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                validTicketData.severity,
                validTicketData.status,
                validTicketData.dueDate
            );

            const errors = await validate(ticket);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(error => error.property === 'ticketNumber')).toBe(true);
        });

        it('should fail validation with invalid workspaceUuid (not UUID)', async () => {
            const ticket = new Ticket(
                validTicketData.ticketNumber,
                'invalid-uuid',
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                validTicketData.severity,
                validTicketData.status,
                validTicketData.dueDate
            );

            const errors = await validate(ticket);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(error => error.property === 'workspaceUuid')).toBe(true);
        });

        it('should fail validation with invalid createdByUuid (not UUID)', async () => {
            const ticket = new Ticket(
                validTicketData.ticketNumber,
                validTicketData.workspaceUuid,
                'not-a-uuid',
                validTicketData.title,
                validTicketData.description,
                validTicketData.severity,
                validTicketData.status,
                validTicketData.dueDate
            );

            const errors = await validate(ticket);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(error => error.property === 'createdByUuid')).toBe(true);
        });

        it('should fail validation with invalid severity enum', async () => {
            const ticket = new Ticket(
                validTicketData.ticketNumber,
                validTicketData.workspaceUuid,
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                'INVALID_SEVERITY' as any,
                validTicketData.status,
                validTicketData.dueDate
            );

            const errors = await validate(ticket);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(error => error.property === 'severity')).toBe(true);
        });

        it('should fail validation with invalid status enum', async () => {
            const ticket = new Ticket(
                validTicketData.ticketNumber,
                validTicketData.workspaceUuid,
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                validTicketData.severity,
                'INVALID_STATUS' as any,
                validTicketData.dueDate
            );

            const errors = await validate(ticket);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(error => error.property === 'status')).toBe(true);
        });

        it('should fail validation with invalid dueDate (not Date)', async () => {
            const ticket = new Ticket(
                validTicketData.ticketNumber,
                validTicketData.workspaceUuid,
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                validTicketData.severity,
                validTicketData.status,
                'not-a-date' as any
            );

            const errors = await validate(ticket);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(error => error.property === 'dueDate')).toBe(true);
        });
    });

    describe('generateTicketNumber', () => {
        it('should generate correct ticket number format', () => {
            const result = Ticket.generateTicketNumber(2024, 1);
            expect(result).toBe('TKT-2024-000001');
        });

        it('should pad sequence number with zeros', () => {
            const result = Ticket.generateTicketNumber(2023, 123);
            expect(result).toBe('TKT-2023-000123');
        });

        it('should handle large sequence numbers', () => {
            const result = Ticket.generateTicketNumber(2025, 999999);
            expect(result).toBe('TKT-2025-999999');
        });

        it('should handle sequence numbers larger than 6 digits', () => {
            const result = Ticket.generateTicketNumber(2025, 1234567);
            expect(result).toBe('TKT-2025-1234567');
        });
    });

    describe('canBeReviewedBy', () => {
        let ticket: Ticket;

        beforeEach(() => {
            ticket = new Ticket(
                validTicketData.ticketNumber,
                validTicketData.workspaceUuid,
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                validTicketData.severity,
                TicketStatus.DRAFT,
                validTicketData.dueDate
            );
        });

        it('should return true when reviewer is different from creator and status is DRAFT', () => {
            const differentManagerUuid = '550e8400-e29b-41d4-a716-446655440099';
            const result = ticket.canBeReviewedBy(differentManagerUuid);
            expect(result).toBe(true);
        });

        it('should return false when reviewer is the same as creator', () => {
            const result = ticket.canBeReviewedBy(validTicketData.createdByUuid);
            expect(result).toBe(false);
        });

        it('should return false when status is not DRAFT', () => {
            ticket.status = TicketStatus.PENDING;
            const differentManagerUuid = '550e8400-e29b-41d4-a716-446655440099';
            const result = ticket.canBeReviewedBy(differentManagerUuid);
            expect(result).toBe(false);
        });

        it('should return false when both reviewer is same as creator AND status is not DRAFT', () => {
            ticket.status = TicketStatus.CLOSED;
            const result = ticket.canBeReviewedBy(validTicketData.createdByUuid);
            expect(result).toBe(false);
        });
    });

    describe('updateSeverity', () => {
        let ticket: Ticket;

        beforeEach(() => {
            ticket = new Ticket(
                validTicketData.ticketNumber,
                validTicketData.workspaceUuid,
                validTicketData.createdByUuid,
                validTicketData.title,
                validTicketData.description,
                TicketSeverity.LOW,
                validTicketData.status,
                validTicketData.dueDate
            );
        });

        it('should update severity and reason', () => {
            const newSeverity = TicketSeverity.HIGH;
            const reason = 'Critical bug discovered';
            const currentSeverity = TicketSeverity.LOW;

            ticket.updateSeverity(newSeverity, reason, currentSeverity);

            expect(ticket.severity).toBe(newSeverity);
            expect(ticket.severityChangeReason).toBe(reason);
        });

        it('should return REVIEW status when severity is increased', () => {
            const currentSeverity = TicketSeverity.LOW;
            const newSeverity = TicketSeverity.HIGH;
            const reason = 'Severity increased due to impact analysis';

            const result = ticket.updateSeverity(newSeverity, reason, currentSeverity);

            expect(result).toBe(TicketStatus.REVIEW);
        });

        it('should return PENDING status when severity is decreased', () => {
            const currentSeverity = TicketSeverity.HIGH;
            const newSeverity = TicketSeverity.LOW;
            const reason = 'False alarm, reducing severity';

            const result = ticket.updateSeverity(newSeverity, reason, currentSeverity);

            expect(result).toBe(TicketStatus.PENDING);
        });

        it('should return PENDING status when severity remains the same', () => {
            const currentSeverity = TicketSeverity.MEDIUM;
            const newSeverity = TicketSeverity.MEDIUM;
            const reason = 'Confirming current severity level';

            const result = ticket.updateSeverity(newSeverity, reason, currentSeverity);

            expect(result).toBe(TicketStatus.PENDING);
        });

        describe('severity level transitions', () => {
            const testCases = [
                { from: TicketSeverity.EASY, to: TicketSeverity.LOW, shouldIncrease: true },
                { from: TicketSeverity.EASY, to: TicketSeverity.MEDIUM, shouldIncrease: true },
                { from: TicketSeverity.EASY, to: TicketSeverity.HIGH, shouldIncrease: true },
                { from: TicketSeverity.EASY, to: TicketSeverity.VERY_HIGH, shouldIncrease: true },
                { from: TicketSeverity.LOW, to: TicketSeverity.MEDIUM, shouldIncrease: true },
                { from: TicketSeverity.LOW, to: TicketSeverity.HIGH, shouldIncrease: true },
                { from: TicketSeverity.LOW, to: TicketSeverity.VERY_HIGH, shouldIncrease: true },
                { from: TicketSeverity.MEDIUM, to: TicketSeverity.HIGH, shouldIncrease: true },
                { from: TicketSeverity.MEDIUM, to: TicketSeverity.VERY_HIGH, shouldIncrease: true },
                { from: TicketSeverity.HIGH, to: TicketSeverity.VERY_HIGH, shouldIncrease: true },
                { from: TicketSeverity.LOW, to: TicketSeverity.EASY, shouldIncrease: false },
                { from: TicketSeverity.MEDIUM, to: TicketSeverity.EASY, shouldIncrease: false },
                { from: TicketSeverity.MEDIUM, to: TicketSeverity.LOW, shouldIncrease: false },
                { from: TicketSeverity.HIGH, to: TicketSeverity.EASY, shouldIncrease: false },
                { from: TicketSeverity.HIGH, to: TicketSeverity.LOW, shouldIncrease: false },
                { from: TicketSeverity.HIGH, to: TicketSeverity.MEDIUM, shouldIncrease: false },
                { from: TicketSeverity.VERY_HIGH, to: TicketSeverity.EASY, shouldIncrease: false },
                { from: TicketSeverity.VERY_HIGH, to: TicketSeverity.LOW, shouldIncrease: false },
                { from: TicketSeverity.VERY_HIGH, to: TicketSeverity.MEDIUM, shouldIncrease: false },
                { from: TicketSeverity.VERY_HIGH, to: TicketSeverity.HIGH, shouldIncrease: false }
            ];

            testCases.forEach(({ from, to, shouldIncrease }) => {
                it(`should ${shouldIncrease ? 'increase' : 'not increase'} severity from ${from} to ${to}`, () => {
                    const reason = `Changing from ${from} to ${to}`;
                    const expectedStatus = shouldIncrease ? TicketStatus.REVIEW : TicketStatus.PENDING;

                    const result = ticket.updateSeverity(to, reason, from);

                    expect(result).toBe(expectedStatus);
                });
            });
        });
    });
});
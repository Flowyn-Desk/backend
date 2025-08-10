export enum TicketStatus {
    DRAFT = 'DRAFT',     // Associate-created, not yet reviewed
    REVIEW = 'REVIEW',   // Manager escalated severity -> needs associate attention
    PENDING = 'PENDING', // Approved by Manager -> eligible for CSV export
    OPEN = 'OPEN',       // External system started working on it (after import)
    CLOSED = 'CLOSED',   // External system closed it (after import)
  }
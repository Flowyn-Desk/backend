import { UserRole } from "../../../../domain/enums/UserRole.js";
import { ITicketService } from "../../../../domain/services/ITicketService.js";
import { Container } from "../../dependency-injection/container.js";
import { Get, Post, Delete, RequireRole } from "../decorators/RouteDecorators.js";
import { BaseController } from "./BaseController.js";
import type { Request, Response  } from "express";

export class TicketController extends BaseController{
    private readonly ticketService: ITicketService;
    
    constructor(container: Container){
        super('TicketController');
        this.ticketService = container.getService('ITicketService')
    }

    @RequireRole(UserRole.ASSOCIATE)
    @Post('/ticket')
    async createTicket(req: Request, res: Response): Promise<void>{
        this.logger.logInfo(`Request received on ${req.path}`);
        const serviceResponse = await this.ticketService.create(req.body)
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

    @RequireRole(UserRole.ASSOCIATE)
    @Get('/ticket/get-all/:workspaceUuid')
    async getAll(req: Request, res: Response): Promise<void>{
        this.logger.logInfo(`Request received on ${req.path}`);
        const { workspaceUuid } = req.params;
        const serviceResponse = await this.ticketService.getTicketsByWorkspace(workspaceUuid)
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

    @RequireRole(UserRole.MANAGER)
    @Post('/ticket/export-pending/:workspaceUuid')
    async exportPendingTickets(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const { workspaceUuid } = req.params;
        const serviceResponse = await this.ticketService.exportPendingTickets(workspaceUuid);
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

    @RequireRole(UserRole.MANAGER)
    @Post('/ticket/import-statuses')
    async importTicketStatuses(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const { csvContent, managerUuid } = req.body;
        const serviceResponse = await this.ticketService.importTicketStatuses(csvContent, managerUuid);
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

    @RequireRole(UserRole.ASSOCIATE)
    @Post('/ticket/suggest-severity')
    async suggestSeverity(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const { title, description } = req.body;
        const serviceResponse = await this.ticketService.suggestSeverity(title, description);
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

    @RequireRole(UserRole.MANAGER)
    @Post('/ticket/review')
    async reviewTicket(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const { ticketUuid, managerUuid, newSeverity, reason } = req.body;
        const serviceResponse = await this.ticketService.reviewTicket(ticketUuid, managerUuid, newSeverity, reason);
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

    @RequireRole(UserRole.MANAGER)
    @Post('/ticket/approve')
    async approveTicket(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const { ticketUuid, managerUuid } = req.body;
        const serviceResponse = await this.ticketService.approveTicket(ticketUuid, managerUuid);
        this.handleResponse(res, serviceResponse);
        this.logger.logDebug(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

    @RequireRole(UserRole.ASSOCIATE)
    @Post('/ticket/update-details')
    async updateTicketDetails(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const { ticketUuid, associateUuid, title, description } = req.body;
        const serviceResponse = await this.ticketService.updateTicketDetails(ticketUuid, associateUuid, title, description);
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

    @RequireRole(UserRole.ASSOCIATE)
    @Delete('/ticket/delete/:uuid')
    async deleteTicket(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const { uuid } = (req as any).params;
        const serviceResponse = await this.ticketService.delete(uuid);
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

    @RequireRole(UserRole.ASSOCIATE)
    @Get('/ticket/history/:uuid')
    async getTicketHistory(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const { uuid } = (req as any).params;
        const serviceResponse = await this.ticketService.getTicketHistory(uuid)
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }
}
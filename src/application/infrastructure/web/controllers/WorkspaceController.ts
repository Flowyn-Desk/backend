import type { Request, Response } from "express";
import { Container } from "../../dependency-injection/container.js";
import type { IWorkspaceService } from "../../../../domain/services/IWorkspaceService.js";
import { Get, Post, RequireRole } from "../decorators/RouteDecorators.js";
import { BaseController } from "./BaseController.js";
import { UserRole } from "../../../../domain/enums/UserRole.js";

export class WorkspaceController extends BaseController {
    private readonly workspaceService: IWorkspaceService;

    constructor(container: Container) {
        super('WorkspaceController');
        this.workspaceService = container.getService('IWorkspaceService');
    }

    @RequireRole(UserRole.ASSOCIATE)
    @Get('/workspaces/user/:userUuid')
    async getWorkspacesFromUser(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const { userUuid } = req.params;
        const serviceResponse = await this.workspaceService.getWorkspacesFromUser(userUuid);
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

    @RequireRole(UserRole.MANAGER)
    @Post('/workspace')
    async createWorkspace(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const request = req.body;
        const serviceResponse = await this.workspaceService.create(request);
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }
}

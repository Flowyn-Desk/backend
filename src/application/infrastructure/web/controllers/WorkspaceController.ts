import type { Request, Response } from "express";
import { Container } from "../../dependecy-injection/container";
import type { IWorkspaceService } from "../../../../domain/services/IWorkspaceService";
import { Get, Post } from "../decorators/RouteDecorators";
import { BaseController } from "./BaseController";

export class WorkspaceController extends BaseController {
    private readonly workspaceService: IWorkspaceService;

    constructor(container: Container) {
        super('WorkspaceController');
        this.workspaceService = container.getService('IWorkspaceService');
    }

    @Get('/workspaces/user/:userUuid')
    async getWorkspacesFromUser(req: Request, res: Response): Promise<void> {
        this.logger.logInfo(`Request received on ${req.path}`);
        const { userUuid } = req.params;
        const serviceResponse = await this.workspaceService.getWorkspacesFromUser(userUuid);
        this.handleResponse(res, serviceResponse);
        this.logger.logInfo(serviceResponse.message);
        this.logger.logInfo(`Request finished on ${req.path}`);
    }

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

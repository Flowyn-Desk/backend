import { UserRole } from "../../../../domain/enums/UserRole.js";
import type { IUserService } from "../../../../domain/services/IUserService.js";
import type { Container } from "../../dependecy-injection/container.js";
import { Get, Post, RequireRole } from "../decorators/RouteDecorators.js";
import { BaseController } from "./BaseController.js";
import type { Request, Response } from "express";


export class UserController extends BaseController {
  private readonly userService: IUserService;

  constructor(container: Container) {
    super();
    this.userService = container.getService('IUserService');
  }

  @Post('/user')
  async createUser(req: Request, res: Response): Promise<void> {
    const serviceResponse = await this.userService.create(req.body);
    this.handleResponse(res, serviceResponse);
  }

  @RequireRole(UserRole.MANAGER)
  @Get('/user/email/:email')
  async getUserByEmail(req: Request, res: Response): Promise<void> {
    const { email } = req.params;
    const serviceResponse = await this.userService.getUserByEmail(email);
    this.handleResponse(res, serviceResponse);
  }

  @RequireRole(UserRole.ADMIN)
  @Get('/user/:uuid')
  async getByUuid(req: Request, res: Response): Promise<void> {
    const { uuid } = (req as any).params;
    const serviceResponse = await this.userService.getByUuid(uuid);
    this.handleResponse(res, serviceResponse);
  }

  @Post('/user/authenticate')
  async authenticateUser(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const serviceResponse = await this.userService.authenticateUser(email, password);
    this.handleResponse(res, serviceResponse);
  }
}
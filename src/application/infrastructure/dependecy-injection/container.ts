import { PrismaClient } from "../../../../generated/prisma/client";
import { UserRepository } from "../database/UserRepository";
import { TicketRepository } from "../database/TicketRepository";
import { TicketHistoryRepository } from "../database/TicketHistoryRepository";
import { WorkspaceRepository } from "../database/WorkspaceRepository";
import { IaService } from "../../services/IaService";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";
import { TicketHistoryService } from "../../services/TicketHistoryService";
import { TicketService } from "../../services/TIcketService";
import { WorkspaceService } from "../../services/WorkspaceService";
import { getRouteMetadata } from "../web/decorators/RouteDecorators";
import { NextFunction } from "express";
import type { Express } from 'express';


export class Container {
    private readonly prisma: PrismaClient;
    private readonly repositories: Map<string, any>;
    private readonly services: Map<string, any>;
  
    constructor() {
      this.prisma = new PrismaClient();
      this.repositories = new Map();
      this.services = new Map();
      this.initialize();
    }
  
    private initialize() {
      // Initialize repositories
      this.repositories.set('IUserRepository', new UserRepository(this.prisma));
      this.repositories.set('ITicketRepository', new TicketRepository(this.prisma));
      this.repositories.set('ITicketHistoryRepository', new TicketHistoryRepository(this.prisma));
      this.repositories.set('IWorkspaceRepository', new WorkspaceRepository(this.prisma));
  
      // Initialize services
      this.services.set('IAiService', new IaService());
      this.services.set('IAuthService', new AuthService());
      this.services.set('IUserService', new UserService(this.getRepository('IUserRepository'), this.getService('IAuthService')));
      this.services.set('ITicketHistoryService', new TicketHistoryService(this.getRepository('ITicketHistoryRepository'), this.getRepository('ITicketRepository')));
      this.services.set('ITicketService', new TicketService(this.getRepository('ITicketRepository'), this.getService('ITicketHistoryService'), this.getService('IAiService')));
      this.services.set('IWorkspaceService', new WorkspaceService(this.getRepository('IWorkspaceRepository')));
    }
  
    getRepository<T>(key: string): T {
      return this.repositories.get(key) as T;
    }
  
    getService<T>(key: string): T {
      return this.services.get(key) as T;
    }
  
    registerRoutes(app: Express, controllers: any[]) {
      app.use((req, res, next) => {
        (req as any).container = this;
        next();
      });
    
      const routes = getRouteMetadata();
      
      for (const route of routes) {
        const controller = controllers.find(c => c.constructor === route.target);
        if (controller) {
          const handler = async (req: Request, res: Response, next: NextFunction) => {
            await controller[route.handler](req, res);
          };
          app[route.method as keyof Express](route.path, ...route.middlewares, handler);
        }
      }
    }
  
    async disconnect() {
      await this.prisma.$disconnect();
    }
  }
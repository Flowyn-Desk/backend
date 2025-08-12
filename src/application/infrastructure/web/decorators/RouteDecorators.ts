import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../../domain/enums/UserRole.js';

const routeMetadata: RouteMetadata[] = [];
const pendingMiddlewares = new Map<string, Function[]>();

interface RouteMetadata {
  target: any;
  method: string;
  path: string;
  handler: string;
  middlewares: Function[];
}

function getRouteKey(target: any, propertyName: string): string {
  return `${target.constructor.name}.${propertyName}`;
}

function addMiddlewareToRoute(target: any, propertyName: string, middleware: Function) {
  const routeKey = getRouteKey(target, propertyName);
  
  const existingRoute = routeMetadata.find(r => 
    r.target === target.constructor && r.handler === propertyName
  );
  
  if (existingRoute) {
    existingRoute.middlewares.push(middleware);
  } else {
    const pending = pendingMiddlewares.get(routeKey) || [];
    pending.push(middleware);
    pendingMiddlewares.set(routeKey, pending);
  }
}

function createRouteWithPendingMiddlewares(target: any, method: string, path: string, propertyName: string) {
  const routeKey = getRouteKey(target, propertyName);
  const pending = pendingMiddlewares.get(routeKey) || [];
  
  const route: RouteMetadata = {
    target: target.constructor,
    method,
    path,
    handler: propertyName,
    middlewares: [...pending]
  };
  
  routeMetadata.push(route);
  
  pendingMiddlewares.delete(routeKey);
  
  return route;
}

export function Get(path: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    createRouteWithPendingMiddlewares(target, 'get', path, propertyName);
  };
}

export function Post(path: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    createRouteWithPendingMiddlewares(target, 'post', path, propertyName);
  };
}

export function Put(path: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    createRouteWithPendingMiddlewares(target, 'put', path, propertyName);
  };
}

export function Delete(path: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    createRouteWithPendingMiddlewares(target, 'delete', path, propertyName);
  };
}

export function RequireRole(role: UserRole) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    addMiddlewareToRoute(target, propertyName, requireRoleMiddleware(role));
  };
}

function requireRoleMiddleware(requiredRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authService = (req as any).container.getService('IAuthService');
    const authHeader = req.headers['authorization'];
    const serviceResponse = authService.userHasAccess(authHeader, requiredRole)
    const userHasAccess = serviceResponse.payload
    if (!userHasAccess) {
      return res.status(serviceResponse.httpStatusCode).json({ 
        message: serviceResponse.message,
        data: null
      });
    }
    next();
  };
}

export function getRouteMetadata() {
  return routeMetadata;
}
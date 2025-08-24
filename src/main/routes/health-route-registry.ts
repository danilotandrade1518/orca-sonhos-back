import { ExpressHttpServerAdapter } from '@http/adapters/express-adapter';
import { HealthController } from '@http/controllers/health/health.controller';
import { ReadyController } from '@http/controllers/health/ready.controller';
import { RouteDefinition } from '@http/server-adapter';

export function registerHealthRoutes(server: ExpressHttpServerAdapter) {
  const routes: RouteDefinition[] = [
    { method: 'GET', path: '/health', controller: new HealthController() },
    { method: 'GET', path: '/ready', controller: new ReadyController() },
  ];

  server.registerRoutes(routes);
}

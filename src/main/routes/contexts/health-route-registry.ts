import { RouteDefinition } from '@http/server-adapter';
import { HealthController } from '@http/controllers/health/health.controller';
import { ReadyController } from '@http/controllers/health/ready.controller';

export function buildHealthRoutes(): RouteDefinition[] {
  return [
    { method: 'GET', path: '/health', controller: new HealthController() },
    { method: 'GET', path: '/ready', controller: new ReadyController() },
  ];
}

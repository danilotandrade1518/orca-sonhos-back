import request from 'supertest';
import { ExpressHttpServerAdapter } from '../../interface/http/adapters/express-adapter';
import { RouteDefinition } from '../../interface/http/server-adapter';
import { HealthController } from '../../interface/http/controllers/health/health.controller';
import { ReadyController } from '../../interface/http/controllers/health/ready.controller';

describe('Health Endpoints (E2E)', () => {
  let server: ExpressHttpServerAdapter;

  beforeAll(() => {
    server = new ExpressHttpServerAdapter();
    const routes: RouteDefinition[] = [
      { method: 'GET', path: '/healthz', controller: new HealthController() },
      { method: 'GET', path: '/readyz', controller: new ReadyController() },
    ];
    server.registerRoutes(routes);
  });

  it('GET /healthz should return 200 and status ok with traceId header', async () => {
    const res = await request(server.rawApp).get('/healthz').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.traceId).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /readyz should indicate readiness or degraded state with traceId', async () => {
    const res = await request(server.rawApp).get('/readyz');
    expect([200, 503]).toContain(res.status);
    expect(['ready', 'degraded']).toContain(res.body.status);
    expect(res.body.dependencies).toBeDefined();
    expect(res.body.dependencies.database).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });
});

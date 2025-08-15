import request from 'supertest';
import { ExpressHttpServerAdapter } from '../../interface/http/adapters/express-adapter';
import { RouteDefinition } from '../../interface/http/server-adapter';

class PingController {
  async handle() {
    return { status: 200, body: { pong: true } };
  }
}

describe('CORS Middleware (enabled)', () => {
  const originalEnv = { ...process.env };
  afterAll(() => {
    process.env = originalEnv;
  });
  it('should set CORS headers for allowed origin', async () => {
    process.env.CORS_ENABLED = 'true';
    process.env.CORS_ORIGINS = 'https://example.com,https://other.com';
    const server = new ExpressHttpServerAdapter();
    const routes: RouteDefinition[] = [
      { method: 'GET', path: '/ping', controller: new PingController() },
    ];
    server.registerRoutes(routes);
    const res = await request(server.rawApp)
      .get('/ping')
      .set('Origin', 'https://example.com')
      .expect(200);
    expect(res.headers['access-control-allow-origin']).toBe(
      'https://example.com',
    );
    expect(res.body.pong).toBe(true);
  });
});

describe('CORS Middleware (disabled)', () => {
  const originalEnv = { ...process.env };
  afterAll(() => {
    process.env = originalEnv;
  });
  it('should not set CORS headers when disabled', async () => {
    delete process.env.CORS_ENABLED;
    const server = new ExpressHttpServerAdapter();
    const routes: RouteDefinition[] = [
      { method: 'GET', path: '/ping', controller: new PingController() },
    ];
    server.registerRoutes(routes);
    const res = await request(server.rawApp)
      .get('/ping')
      .set('Origin', 'https://example.com')
      .expect(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

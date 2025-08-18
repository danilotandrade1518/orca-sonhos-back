import request from 'supertest';
import { createHttpTestServer } from '../support/http-test-server';
import { RouteDefinition } from '@http/server-adapter';
import { createAuthMiddleware } from '@http/middlewares/auth-middleware';
import {
  IJwtValidator,
  DecodedTokenPayload,
} from '@application/services/auth/IJwtValidator';
import {
  IPrincipalFactory,
  Principal,
} from '@application/services/auth/IPrincipalFactory';
import { Either } from '@either';
import { ApplicationError } from '@application/shared/errors/ApplicationError';

// Stubs focusing only on auth pipeline
class StubValidator implements IJwtValidator {
  constructor(private mode: 'ok' | 'fail') {}
  async validate(token: string) {
    if (this.mode === 'fail') {
      const Err = class extends ApplicationError {};
      return Either.error<ApplicationError, DecodedTokenPayload>(
        new Err('invalid token'),
      );
    }
    return Either.success<ApplicationError, DecodedTokenPayload>({
      userId: token === 'special' ? 'user-123' : 'anon',
      raw: { sub: 'user-123' },
    });
  }
}

class StubPrincipalFactory implements IPrincipalFactory {
  async fromDecoded(decoded: DecodedTokenPayload) {
    return Either.success<ApplicationError, Principal>({
      userId: decoded.userId,
      roles: [],
      claims: decoded.raw,
    });
  }
}

describe('Auth middleware (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  beforeAll(() => {
    const goodValidator = new StubValidator('ok');
    const badValidator = new StubValidator('fail');
    const principalFactory = new StubPrincipalFactory();

    const okAuth = createAuthMiddleware(goodValidator, principalFactory, true);
    const failAuth = createAuthMiddleware(badValidator, principalFactory, true);

    const routes: RouteDefinition[] = [
      {
        method: 'POST',
        path: '/auth-test/success',
        controller: {
          handle: async (req) => ({
            status: 200,
            body: {
              ok: true,
              userId: req.principal?.userId,
              traceId: req.requestId,
            },
          }),
        },
        middlewares: [okAuth],
      },
      {
        method: 'POST',
        path: '/auth-test/fail',
        controller: {
          handle: async () => ({ status: 200, body: { shouldNot: 'reach' } }),
        },
        middlewares: [failAuth],
      },
    ];
    register(...routes);
  });

  afterAll(async () => {
    await close();
  });

  it('returns 403 when missing token', async () => {
    const res = await request(server.rawApp)
      .post('/auth-test/success')
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.errors?.[0]).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('authenticates with valid bearer token and exposes principal', async () => {
    const res = await request(server.rawApp)
      .post('/auth-test/success')
      .set('Authorization', 'Bearer special')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.userId).toBe('user-123');
    expect(res.body.traceId).toBeDefined();
  });

  it('rejects when validator fails (invalid token)', async () => {
    const res = await request(server.rawApp)
      .post('/auth-test/fail')
      .set('Authorization', 'Bearer whatever')
      .send({});
    expect(res.status).toBe(403);
    expect(res.body.errors?.[0]).toBeDefined();
  });
});

import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { MockBudgetAuthorizationService } from './setup/mock-budget-authorization-service';
import { TestContainersSetup } from './setup/testcontainers-setup';
import { buildBudgetQueryRoutes } from '../../main/routes/contexts/queries/budgets-query-route-registry';
import { createHttpTestServer } from '../e2e/support/http-test-server';
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
import request from 'supertest';

const testUserId = EntityId.create().value!.id;
const testBudgetId = EntityId.create().value!.id;

class StubJwtValidator implements IJwtValidator {
  async validate(token: string) {
    if (token === 'invalid') {
      const Err = class extends ApplicationError {};
      return Either.error<ApplicationError, DecodedTokenPayload>(
        new Err('invalid token'),
      );
    }
    return Either.success<ApplicationError, DecodedTokenPayload>({
      userId: testUserId,
      raw: { sub: testUserId },
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

describe('GET /budget/:budgetId/dashboard/insights (Integration)', () => {
  let connection: PostgresConnectionAdapter;
  let authService: MockBudgetAuthorizationService;
  const { server, register, close } = createHttpTestServer();

  beforeAll(async () => {
    connection = await TestContainersSetup.setup();
    authService = new MockBudgetAuthorizationService();
    authService.setUserPermissions(testUserId, [testBudgetId]);

    const validator = new StubJwtValidator();
    const principalFactory = new StubPrincipalFactory();
    const authMiddleware = createAuthMiddleware(
      validator,
      principalFactory,
      true,
    );

    const routes = buildBudgetQueryRoutes({
      connection,
      auth: authService,
    });

    const routesWithAuth = routes.map((route) => ({
      ...route,
      middlewares: [authMiddleware],
    }));

    register(...routesWithAuth);
  });

  afterAll(async () => {
    await close();
    await TestContainersSetup.teardown();
  });

  beforeEach(async () => {
    await TestContainersSetup.resetDatabase();
    authService.clearPermissions();
    authService.setUserPermissions(testUserId, [testBudgetId]);
  });

  describe('Authorization', () => {
    it('should return 403 when missing authorization token', async () => {
      const res = await request(server.rawApp)
        .get(`/budget/${testBudgetId}/dashboard/insights`)
        .expect(403);

      expect(res.body.errors).toBeDefined();
      expect(res.body.traceId).toBeDefined();
    });

    it('should return 403 when token is invalid', async () => {
      const res = await request(server.rawApp)
        .get(`/budget/${testBudgetId}/dashboard/insights`)
        .set('Authorization', 'Bearer invalid')
        .expect(403);

      expect(res.body.errors).toBeDefined();
      expect(res.body.traceId).toBeDefined();
    });

    it('should return 403 when user does not have access to budget', async () => {
      authService.setRejectAll(true);

      const res = await request(server.rawApp)
        .get(`/budget/${testBudgetId}/dashboard/insights`)
        .set('Authorization', 'Bearer valid')
        .expect(403);

      expect(res.body.errors).toBeDefined();
      expect(res.body.traceId).toBeDefined();
    });
  });

  describe('Response Structure', () => {
    beforeEach(async () => {
      await connection.query(
        `INSERT INTO budgets (id, name, owner_id, type, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, NOW(), NOW())`,
        [testBudgetId, 'Test Budget', testUserId, BudgetTypeEnum.PERSONAL],
      );
    });

    it('should return 200 with correct payload structure', async () => {
      const res = await request(server.rawApp)
        .get(`/budget/${testBudgetId}/dashboard/insights`)
        .set('Authorization', 'Bearer valid')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('traceId');
      expect(res.body.data).toHaveProperty('indicators');
      expect(res.body.data).toHaveProperty('suggestedActions');
      expect(res.body.data).toHaveProperty('recentAchievements');
      expect(res.body.data).toHaveProperty('categorySpending');

      expect(res.body.data.indicators).toHaveProperty('budgetUsage');
      expect(res.body.data.indicators).toHaveProperty('cashFlow');
      expect(res.body.data.indicators).toHaveProperty('goalsOnTrack');
      expect(res.body.data.indicators).toHaveProperty('emergencyReserve');

      expect(Array.isArray(res.body.data.suggestedActions)).toBe(true);
      expect(Array.isArray(res.body.data.recentAchievements)).toBe(true);
      expect(Array.isArray(res.body.data.categorySpending)).toBe(true);
    });

    it('should return null indicators when no financial data exists', async () => {
      const res = await request(server.rawApp)
        .get(`/budget/${testBudgetId}/dashboard/insights`)
        .set('Authorization', 'Bearer valid')
        .expect(200);

      expect(res.body.data.indicators.budgetUsage).toBeNull();
      expect(res.body.data.indicators.cashFlow).toBeNull();
      expect(res.body.data.indicators.emergencyReserve).toBeNull();
      expect(res.body.data.indicators.goalsOnTrack).toBeNull();
      expect(res.body.data.suggestedActions).toEqual([]);
      expect(res.body.data.recentAchievements).toEqual([]);
      expect(res.body.data.categorySpending).toEqual([]);
    });
  });

  describe('With Financial Data', () => {
    let categoryId: string;
    let accountId: string;

    beforeEach(async () => {
      await connection.query(
        `INSERT INTO budgets (id, name, owner_id, type, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, false, NOW(), NOW())`,
        [testBudgetId, 'Test Budget', testUserId, BudgetTypeEnum.PERSONAL],
      );

      categoryId = EntityId.create().value!.id;
      await connection.query(
        `INSERT INTO categories (id, name, type, user_id, budget_id, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
        [categoryId, 'Test Category', 'EXPENSE', testUserId, testBudgetId],
      );

      accountId = EntityId.create().value!.id;
      await connection.query(
        `INSERT INTO accounts (id, name, type, balance, budget_id, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
        [accountId, 'Test Account', 'CHECKING', '100000', testBudgetId],
      );

      const now = new Date();
      const periodStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );

      await connection.query(
        `INSERT INTO transactions (id, description, amount, type, account_id, category_id, budget_id, transaction_date, status, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW(), NOW())`,
        [
          EntityId.create().value!.id,
          'Test Expense',
          '5000',
          'EXPENSE',
          accountId,
          categoryId,
          testBudgetId,
          periodStart,
          'COMPLETED',
        ],
      );

      await connection.query(
        `INSERT INTO transactions (id, description, amount, type, account_id, budget_id, transaction_date, status, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW(), NOW())`,
        [
          EntityId.create().value!.id,
          'Test Income',
          '10000',
          'INCOME',
          accountId,
          testBudgetId,
          periodStart,
          'COMPLETED',
        ],
      );
    });

    it('should return financial indicators with real data', async () => {
      const res = await request(server.rawApp)
        .get(`/budget/${testBudgetId}/dashboard/insights`)
        .set('Authorization', 'Bearer valid')
        .expect(200);

      expect(res.body.data.indicators.cashFlow).not.toBeNull();
      expect(res.body.data.indicators.cashFlow).toHaveProperty('ratio');
      expect(res.body.data.indicators.cashFlow).toHaveProperty('absoluteValue');
      expect(res.body.data.indicators.cashFlow).toHaveProperty('status');
      expect(res.body.data.indicators.cashFlow).toHaveProperty('label');
      expect(res.body.data.indicators.cashFlow).toHaveProperty('description');

      expect(res.body.data.categorySpending.length).toBeGreaterThan(0);
      const category = res.body.data.categorySpending[0];
      expect(category).toHaveProperty('categoryId');
      expect(category).toHaveProperty('categoryName');
      expect(category).toHaveProperty('totalAmount');
      expect(category).toHaveProperty('percentage');
      expect(category).toHaveProperty('transactionCount');
    });
  });
});

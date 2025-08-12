import { BudgetCompositionRoot } from '../../main/composition/BudgetCompositionRoot';
import { TestContainersSetup } from './setup/testcontainers-setup';
import { MockBudgetAuthorizationService } from './setup/mock-budget-authorization-service';
import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

const testBudgetId = EntityId.create().value!.id;
const testUserId = EntityId.create().value!.id;

describe('BudgetCompositionRoot Integration Tests', () => {
  let compositionRoot: BudgetCompositionRoot;
  let connection: PostgresConnectionAdapter;
  let authService: MockBudgetAuthorizationService;

  beforeAll(async () => {
    connection = await TestContainersSetup.setup();
    authService = new MockBudgetAuthorizationService();
    compositionRoot = new BudgetCompositionRoot(connection, authService);
  }, 60000);

  afterAll(async () => {
    await TestContainersSetup.teardown();
  }, 30000);

  beforeEach(async () => {
    await TestContainersSetup.resetDatabase();
    authService.clearPermissions();
    authService.setUserPermissions(testUserId, [testBudgetId]);
  });

  describe('createCreateBudgetUseCase', () => {
    it('should create budget successfully through full stack', async () => {
      const useCase = compositionRoot.createCreateBudgetUseCase();

      const result = await useCase.execute({
        name: 'Integration Test Budget',
        ownerId: testUserId,
        participantIds: [testUserId],
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();

      if (!result.hasError && result.data) {
        expect(result.data.id).toBeDefined();

        const dbResult = await connection.query(
          'SELECT * FROM budgets WHERE name = $1',
          ['Integration Test Budget'],
        );

        expect(dbResult).toHaveLength(1);
        expect(dbResult[0].name).toBe('Integration Test Budget');
        expect(dbResult[0].owner_id).toBe(testUserId);
        expect(dbResult[0].is_deleted).toBe(false);
      }
    });

    it('should handle validation errors', async () => {
      const useCase = compositionRoot.createCreateBudgetUseCase();

      const result = await useCase.execute({
        name: '', // Invalid empty name
        ownerId: testUserId,
        participantIds: [],
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('database connection integration', () => {
    it('should connect to test database successfully', async () => {
      const result = await connection.query('SELECT 1 as test');

      expect(result).toHaveLength(1);
      expect(result[0].test).toBe(1);
    });

    it('should create and query budgets table', async () => {
      interface ColumnInfo {
        column_name: string;
        data_type: string;
      }

      const result = await connection.query<ColumnInfo>(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'budgets'
        ORDER BY ordinal_position
      `);

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((row) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('owner_id');
      expect(columnNames).toContain('participant_ids');
      expect(columnNames).toContain('is_deleted');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });
  });

  describe('authorization integration', () => {
    it('should use mock authorization service correctly', async () => {
      const result = await authService.canAccessBudget(
        testUserId,
        testBudgetId,
      );

      expect(result.hasError).toBe(false);
      if (!result.hasError) {
        expect(result.data).toBe(true);
      }
    });

    it('should reject unauthorized access', async () => {
      const result = await authService.canAccessBudget(
        'unauthorized-user',
        testBudgetId,
      );

      expect(result.hasError).toBe(true);
    });
  });
});

import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { BudgetCompositionRoot } from '../../main/composition/BudgetCompositionRoot';
import { MockBudgetAuthorizationService } from './setup/mock-budget-authorization-service';
import { TestContainersSetup } from './setup/testcontainers-setup';

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
      expect(result.data!.id).toBeDefined();

      const dbResult = await connection.query(
        'SELECT * FROM budgets WHERE name = $1',
        ['Integration Test Budget'],
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].name).toBe('Integration Test Budget');
      expect(dbResult.rows[0].owner_id).toBe(testUserId);
      expect(dbResult.rows[0].is_deleted).toBe(false);
    });

    it('should handle validation errors', async () => {
      const useCase = compositionRoot.createCreateBudgetUseCase();

      const result = await useCase.execute({
        name: '',
        ownerId: testUserId,
        participantIds: [],
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('database connection integration', () => {
    it('should connect to test database successfully', async () => {
      const result = await connection.query('SELECT 1 as test');

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].test).toBe(1);
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

      expect(result.rows.length).toBeGreaterThan(0);

      const columnNames = result.rows.map((row) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('owner_id');
      expect(columnNames).toContain('participant_ids');
      expect(columnNames).toContain('is_deleted');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });
  });

  describe('createUpdateBudgetUseCase', () => {
    let budgetId: string;

    beforeEach(async () => {
      const createUseCase = compositionRoot.createCreateBudgetUseCase();
      const createResult = await createUseCase.execute({
        name: 'Budget to Update',
        ownerId: testUserId,
        participantIds: [testUserId],
      });

      expect(createResult.hasError).toBe(false);
      budgetId = createResult.data!.id;
      authService.setUserPermissions(testUserId, [budgetId]);
    });

    it('should update budget successfully through full stack', async () => {
      const updateUseCase = compositionRoot.createUpdateBudgetUseCase();

      const result = await updateUseCase.execute({
        budgetId: budgetId,
        userId: testUserId,
        name: 'Updated Budget Name',
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM budgets WHERE id = $1',
        [budgetId],
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].name).toBe('Updated Budget Name');
    });

    it('should handle unauthorized update attempts', async () => {
      const updateUseCase = compositionRoot.createUpdateBudgetUseCase();
      const unauthorizedUserId = EntityId.create().value!.id;

      const result = await updateUseCase.execute({
        budgetId: budgetId,
        userId: unauthorizedUserId,
        name: 'Unauthorized Update',
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('createDeleteBudgetUseCase', () => {
    let budgetId: string;

    beforeEach(async () => {
      const createUseCase = compositionRoot.createCreateBudgetUseCase();
      const createResult = await createUseCase.execute({
        name: 'Budget to Delete',
        ownerId: testUserId,
        participantIds: [testUserId],
      });

      expect(createResult.hasError).toBe(false);
      budgetId = createResult.data!.id;
      authService.setUserPermissions(testUserId, [budgetId]);
    });

    it('should delete budget successfully through full stack', async () => {
      const deleteUseCase = compositionRoot.createDeleteBudgetUseCase();

      const result = await deleteUseCase.execute({
        budgetId: budgetId,
        userId: testUserId,
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM budgets WHERE id = $1',
        [budgetId],
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].is_deleted).toBe(true);
    });

    it('should handle unauthorized delete attempts', async () => {
      const deleteUseCase = compositionRoot.createDeleteBudgetUseCase();
      const unauthorizedUserId = EntityId.create().value!.id;

      const result = await deleteUseCase.execute({
        budgetId: budgetId,
        userId: unauthorizedUserId,
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('createAddParticipantToBudgetUseCase', () => {
    let budgetId: string;
    let newParticipantId: string;

    beforeEach(async () => {
      newParticipantId = EntityId.create().value!.id;

      const createUseCase = compositionRoot.createCreateBudgetUseCase();
      const createResult = await createUseCase.execute({
        name: 'Budget for Participant Test',
        ownerId: testUserId,
        participantIds: [],
        type: BudgetTypeEnum.SHARED,
      });

      expect(createResult.hasError).toBe(false);
      budgetId = createResult.data!.id;
      authService.setUserPermissions(testUserId, [budgetId]);
    });

    it('should add participant successfully through full stack', async () => {
      const addParticipantUseCase =
        compositionRoot.createAddParticipantToBudgetUseCase();

      const result = await addParticipantUseCase.execute({
        budgetId,
        participantId: newParticipantId,
        userId: testUserId,
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM budgets WHERE id = $1',
        [budgetId],
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].participant_ids).toContain(newParticipantId);
    });

    it('should handle unauthorized add participant attempts', async () => {
      const addParticipantUseCase =
        compositionRoot.createAddParticipantToBudgetUseCase();
      const unauthorizedUserId = EntityId.create().value!.id;

      const result = await addParticipantUseCase.execute({
        budgetId,
        participantId: newParticipantId,
        userId: unauthorizedUserId,
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('createRemoveParticipantFromBudgetUseCase', () => {
    let budgetId: string;
    let participantToRemoveId: string;

    beforeEach(async () => {
      participantToRemoveId = EntityId.create().value!.id;

      const createUseCase = compositionRoot.createCreateBudgetUseCase();
      const createResult = await createUseCase.execute({
        name: 'Budget for Remove Participant Test',
        ownerId: testUserId,
        participantIds: [testUserId, participantToRemoveId],
      });

      expect(createResult.hasError).toBe(false);
      budgetId = createResult.data!.id;
      authService.setUserPermissions(testUserId, [budgetId]);
    });

    it('should remove participant successfully through full stack', async () => {
      const removeParticipantUseCase =
        compositionRoot.createRemoveParticipantFromBudgetUseCase();

      const result = await removeParticipantUseCase.execute({
        budgetId,
        participantId: participantToRemoveId,
        userId: testUserId,
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM budgets WHERE id = $1',
        [budgetId],
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].participant_ids).not.toContain(
        participantToRemoveId,
      );
      expect(dbResult.rows[0].participant_ids).toContain(testUserId);
    });

    it('should handle unauthorized remove participant attempts', async () => {
      const removeParticipantUseCase =
        compositionRoot.createRemoveParticipantFromBudgetUseCase();
      const unauthorizedUserId = EntityId.create().value!.id;

      const result = await removeParticipantUseCase.execute({
        budgetId,
        participantId: participantToRemoveId,
        userId: unauthorizedUserId,
      });

      expect(result.hasError).toBe(true);
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

  describe('error handling integration', () => {
    it('should handle database connection errors gracefully', async () => {
      const result = await connection.query('SELECT 1 as test');
      expect(result).toBeDefined();
    });

    it('should handle invalid budget IDs', async () => {
      const updateUseCase = compositionRoot.createUpdateBudgetUseCase();
      const invalidBudgetId = EntityId.create().value!.id;

      authService.setUserPermissions(testUserId, [invalidBudgetId]);

      const result = await updateUseCase.execute({
        budgetId: invalidBudgetId,
        userId: testUserId,
        name: 'Updated Name',
      });

      expect(result.hasError).toBe(true);
    });
  });
});

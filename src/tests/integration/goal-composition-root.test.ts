import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { GoalCompositionRoot } from '../../main/composition/GoalCompositionRoot';
import { MockBudgetAuthorizationService } from './setup/mock-budget-authorization-service';
import { TestContainersSetup } from './setup/testcontainers-setup';

let testUserId: string;
let testBudgetId: string;
let testGoalId: string;

describe('GoalCompositionRoot Integration Tests', () => {
  let connection: PostgresConnectionAdapter;
  let compositionRoot: GoalCompositionRoot;
  let authService: MockBudgetAuthorizationService;

  beforeAll(async () => {
    connection = await TestContainersSetup.setup();
    authService = new MockBudgetAuthorizationService();
    compositionRoot = new GoalCompositionRoot(connection);
  });

  afterAll(async () => {
    await TestContainersSetup.teardown();
  });

  beforeEach(async () => {
    await TestContainersSetup.resetDatabase();

    testUserId = EntityId.create().value!.id;

    // Seed budget
    testBudgetId = EntityId.create().value!.id;
    await connection.query(
      `INSERT INTO budgets (id, name, owner_id, type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [testBudgetId, 'Budget Goal', testUserId, BudgetTypeEnum.PERSONAL],
    );

    authService.clearPermissions();
    authService.setUserPermissions(testUserId, [testBudgetId]);
  });

  describe('createCreateGoalUseCase', () => {
    it('should create goal successfully', async () => {
      const useCase = compositionRoot.createCreateGoalUseCase();
      const result = await useCase.execute({
        budgetId: testBudgetId,
        name: 'Trip',
        totalAmount: 100000, // cents
        accumulatedAmount: 0,
        deadline: undefined,
      });

      expect(result.hasError).toBe(false);
      expect(result.data?.id).toBeDefined();

      testGoalId = result.data!.id;
      const db = await connection.query('SELECT * FROM goals WHERE id = $1', [
        testGoalId,
      ]);
      expect(db?.rows.length).toBe(1);
      expect(db?.rows[0].name).toBe('Trip');
      expect(Number(db?.rows[0].total_amount)).toBe(100000);
    });
  });

  describe('createUpdateGoalUseCase', () => {
    beforeEach(async () => {
      const create = compositionRoot.createCreateGoalUseCase();
      const created = await create.execute({
        budgetId: testBudgetId,
        name: 'Car',
        totalAmount: 500000,
      });
      testGoalId = created.data!.id;
    });

    it('should update goal name and target amount with deadline', async () => {
      const update = compositionRoot.createUpdateGoalUseCase();
      const result = await update.execute({
        id: testGoalId,
        name: 'New Car',
        totalAmount: 600000,
        deadline: new Date('2031-01-01'),
      });
      expect(result.hasError).toBe(false);

      const db = await connection.query('SELECT * FROM goals WHERE id = $1', [
        testGoalId,
      ]);
      expect(db?.rows[0].name).toBe('New Car');
      expect(Number(db?.rows[0].total_amount)).toBe(600000);
    });
  });

  describe('createAddAmountToGoalUseCase', () => {
    beforeEach(async () => {
      const create = compositionRoot.createCreateGoalUseCase();
      const created = await create.execute({
        budgetId: testBudgetId,
        name: 'Laptop',
        totalAmount: 300000,
      });
      testGoalId = created.data!.id;
    });

    it('should accumulate added amounts', async () => {
      const addAmount = compositionRoot.createAddAmountToGoalUseCase();
      await addAmount.execute({ id: testGoalId, amount: 10000 });
      await addAmount.execute({ id: testGoalId, amount: 5000 });

      const db = await connection.query(
        'SELECT accumulated_amount FROM goals WHERE id = $1',
        [testGoalId],
      );
      expect(Number(db?.rows[0].accumulated_amount)).toBe(15000);
    });
  });

  describe('createDeleteGoalUseCase', () => {
    beforeEach(async () => {
      const create = compositionRoot.createCreateGoalUseCase();
      const created = await create.execute({
        budgetId: testBudgetId,
        name: 'Remove Me',
        totalAmount: 100000,
      });
      console.log(created.errors);
      testGoalId = created.data!.id;
    });

    it('should soft delete goal', async () => {
      const del = compositionRoot.createDeleteGoalUseCase();
      const result = await del.execute({ id: testGoalId });

      expect(result.hasError).toBe(false);

      const db = await connection.query(
        'SELECT is_deleted FROM goals WHERE id = $1',
        [testGoalId],
      );
      expect(db?.rows[0].is_deleted).toBe(true);
    });
  });
});

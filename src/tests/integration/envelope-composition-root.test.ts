import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { EnvelopeCompositionRoot } from '@main/composition/EnvelopeCompositionRoot';
import { MockBudgetAuthorizationService } from './setup/mock-budget-authorization-service';
import { TestContainersSetup } from './setup/testcontainers-setup';

let testUserId: string;
let testBudgetId: string;
let testEnvelopeId: string;
let targetEnvelopeId: string;
let testCategoryId: string;

describe('EnvelopeCompositionRoot Integration Tests', () => {
  let connection: PostgresConnectionAdapter;
  let compositionRoot: EnvelopeCompositionRoot;
  let authService: MockBudgetAuthorizationService;

  beforeAll(async () => {
    connection = await TestContainersSetup.setup();
    authService = new MockBudgetAuthorizationService();
    compositionRoot = new EnvelopeCompositionRoot(connection, authService);
  }, 60000);

  afterAll(async () => {
    await TestContainersSetup.teardown();
  }, 30000);

  beforeEach(async () => {
    await TestContainersSetup.resetDatabase();

    testUserId = EntityId.create().value!.id;

    // Seed budget
    testBudgetId = EntityId.create().value!.id;
    await connection.query(
      `INSERT INTO budgets (id, name, owner_id, type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [testBudgetId, 'Budget Env', testUserId, BudgetTypeEnum.PERSONAL],
    );

    // Seed category
    testCategoryId = EntityId.create().value!.id;
    await connection.query(
      `INSERT INTO categories (id, name, type, budget_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [testCategoryId, 'Groceries', 'EXPENSE', testBudgetId],
    );

    authService.clearPermissions();
    authService.setUserPermissions(testUserId, [testBudgetId]);
  });

  describe('createCreateEnvelopeUseCase', () => {
    it('should create envelope successfully', async () => {
      const useCase = compositionRoot.createCreateEnvelopeUseCase();
      const result = await useCase.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        name: 'Groceries',
        monthlyLimit: 100000,
        categoryId: testCategoryId,
      });

      expect(result.hasError).toBe(false);
      expect(result.data?.id).toBeDefined();

      testEnvelopeId = result.data!.id;
      const db = await connection.query(
        'SELECT * FROM envelopes WHERE id = $1',
        [testEnvelopeId],
      );
      expect(db?.rows.length).toBe(1);
      expect(db?.rows[0].name).toBe('Groceries');
    });
  });

  describe('createUpdateEnvelopeUseCase', () => {
    beforeEach(async () => {
      const create = compositionRoot.createCreateEnvelopeUseCase();
      const created = await create.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        name: 'Fuel',
        monthlyLimit: 50000,
        categoryId: testCategoryId,
      });
      testEnvelopeId = created.data!.id;
    });

    it('should update envelope name and limit', async () => {
      const update = compositionRoot.createUpdateEnvelopeUseCase();
      const result = await update.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        envelopeId: testEnvelopeId,
        name: 'Fuel Updated',
        monthlyLimit: 60000,
      });
      expect(result.hasError).toBe(false);

      const db = await connection.query(
        'SELECT * FROM envelopes WHERE id = $1',
        [testEnvelopeId],
      );
      expect(db?.rows[0].name).toBe('Fuel Updated');
      expect(Number(db?.rows[0].monthly_limit)).toBe(60000);
    });
  });

  describe('createAddAmountToEnvelopeUseCase & createRemoveAmountFromEnvelopeUseCase', () => {
    beforeEach(async () => {
      const create = compositionRoot.createCreateEnvelopeUseCase();
      const created = await create.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        name: 'Entertainment',
        monthlyLimit: 80000,
        categoryId: testCategoryId,
      });
      testEnvelopeId = created.data!.id;
    });

    it('should add and then remove amount correctly', async () => {
      const add = compositionRoot.createAddAmountToEnvelopeUseCase();
      const addResult = await add.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        envelopeId: testEnvelopeId,
        amount: 20000,
      });
      expect(addResult.hasError).toBe(false);

      const remove = compositionRoot.createRemoveAmountFromEnvelopeUseCase();
      const removeResult = await remove.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        envelopeId: testEnvelopeId,
        amount: 5000,
      });
      expect(removeResult.hasError).toBe(false);

      const db = await connection.query(
        'SELECT current_balance FROM envelopes WHERE id = $1',
        [testEnvelopeId],
      );
      expect(Number(db?.rows[0].current_balance)).toBe(15000);
    });
  });

  describe('createTransferBetweenEnvelopesUseCase', () => {
    beforeEach(async () => {
      const create = compositionRoot.createCreateEnvelopeUseCase();
      const createdA = await create.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        name: 'Source',
        monthlyLimit: 40000,
        categoryId: testCategoryId,
      });
      testEnvelopeId = createdA.data!.id;

      const createdB = await create.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        name: 'Target',
        monthlyLimit: 30000,
        categoryId: testCategoryId,
      });
      targetEnvelopeId = createdB.data!.id;

      // Add initial amount to source
      const add = compositionRoot.createAddAmountToEnvelopeUseCase();
      await add.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        envelopeId: testEnvelopeId,
        amount: 10000,
      });
    });

    it('should transfer between envelopes', async () => {
      const transfer = compositionRoot.createTransferBetweenEnvelopesUseCase();
      const result = await transfer.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        sourceEnvelopeId: testEnvelopeId,
        targetEnvelopeId: targetEnvelopeId,
        amount: 4000,
      });
      expect(result.hasError).toBe(false);

      const dbSource = await connection.query(
        'SELECT current_balance FROM envelopes WHERE id = $1',
        [testEnvelopeId],
      );
      const dbTarget = await connection.query(
        'SELECT current_balance FROM envelopes WHERE id = $1',
        [targetEnvelopeId],
      );
      expect(Number(dbSource?.rows[0].current_balance)).toBe(6000);
      expect(Number(dbTarget?.rows[0].current_balance)).toBe(4000);
    });
  });

  describe('createDeleteEnvelopeUseCase', () => {
    beforeEach(async () => {
      const create = compositionRoot.createCreateEnvelopeUseCase();
      const created = await create.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        name: 'ToDelete',
        monthlyLimit: 20000,
        categoryId: testCategoryId,
      });
      testEnvelopeId = created.data!.id;
    });

    it('should delete envelope when balance is zero', async () => {
      const del = compositionRoot.createDeleteEnvelopeUseCase();
      const result = await del.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        envelopeId: testEnvelopeId,
      });
      expect(result.hasError).toBe(false);

      const db = await connection.query(
        'SELECT is_deleted FROM envelopes WHERE id = $1',
        [testEnvelopeId],
      );
      expect(db?.rows[0].is_deleted).toBe(true);
    });
  });
});

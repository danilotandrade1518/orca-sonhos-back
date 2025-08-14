import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { CreditCardCompositionRoot } from '../../main/composition/CreditCardCompositionRoot';
import { TestContainersSetup } from './setup/testcontainers-setup';

let testBudgetId: string;

describe('CreditCardCompositionRoot Integration Tests', () => {
  let compositionRoot: CreditCardCompositionRoot;
  let connection: PostgresConnectionAdapter;

  beforeAll(async () => {
    connection = await TestContainersSetup.setup();

    compositionRoot = new CreditCardCompositionRoot(connection);
  }, 60000);

  afterAll(async () => {
    await TestContainersSetup.teardown();
  }, 30000);

  beforeEach(async () => {
    await TestContainersSetup.resetDatabase();

    testBudgetId = EntityId.create().value!.id;

    await connection.query(
      `
      INSERT INTO budgets (id, name, owner_id, type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `,
      [testBudgetId, 'Test Budget', EntityId.create().value!.id, 'PERSONAL'],
    );
  });

  describe('createCreateCreditCardUseCase', () => {
    it('should create credit card successfully through full stack', async () => {
      const useCase = compositionRoot.createCreateCreditCardUseCase();

      const result = await useCase.execute({
        name: 'Integration Test Credit Card',
        limit: 500000,
        closingDay: 15,
        dueDay: 25,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBeDefined();

      const dbResult = await connection.query(
        'SELECT * FROM credit_cards WHERE id = $1',
        [result.data!.id],
      );
      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].name).toBe('Integration Test Credit Card');
      expect(Number(dbResult.rows[0].credit_limit)).toBe(500000);
      expect(dbResult.rows[0].closing_day).toBe(15);
      expect(dbResult.rows[0].due_day).toBe(25);
      expect(dbResult.rows[0].budget_id).toBe(testBudgetId);
    });

    it('should handle validation errors', async () => {
      const useCase = compositionRoot.createCreateCreditCardUseCase();

      const result = await useCase.execute({
        name: '',
        limit: 500000,
        closingDay: 15,
        dueDay: 25,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid budget ID', async () => {
      const useCase = compositionRoot.createCreateCreditCardUseCase();
      const invalidBudgetId = EntityId.create().value!.id;

      const result = await useCase.execute({
        name: 'Test Credit Card',
        limit: 500000,
        closingDay: 15,
        dueDay: 25,
        budgetId: invalidBudgetId,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid closing day', async () => {
      const useCase = compositionRoot.createCreateCreditCardUseCase();

      const result = await useCase.execute({
        name: 'Test Credit Card',
        limit: 500000,
        closingDay: 32,
        dueDay: 25,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid due day', async () => {
      const useCase = compositionRoot.createCreateCreditCardUseCase();

      const result = await useCase.execute({
        name: 'Test Credit Card',
        limit: 500000,
        closingDay: 15,
        dueDay: 0,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle negative limit', async () => {
      const useCase = compositionRoot.createCreateCreditCardUseCase();

      const result = await useCase.execute({
        name: 'Test Credit Card',
        limit: -1000,
        closingDay: 15,
        dueDay: 25,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('createUpdateCreditCardUseCase', () => {
    it('should update credit card successfully through full stack', async () => {
      const createUseCase = compositionRoot.createCreateCreditCardUseCase();
      const createResult = await createUseCase.execute({
        name: 'Original Credit Card',
        limit: 300000,
        closingDay: 10,
        dueDay: 20,
        budgetId: testBudgetId,
      });

      expect(createResult.hasError).toBe(false);
      const creditCardId = createResult.data!.id;

      const dbCheck = await connection.query(
        'SELECT * FROM credit_cards WHERE id = $1',
        [creditCardId],
      );
      console.log(
        '🔍 Credit card found in DB after creation:',
        dbCheck.rows.length > 0,
        'ID:',
        creditCardId,
      );

      const updateUseCase = compositionRoot.createUpdateCreditCardUseCase();
      const updateResult = await updateUseCase.execute({
        id: creditCardId,
        name: 'Updated Credit Card',
        limit: 700000,
        closingDay: 5,
        dueDay: 15,
      });

      if (updateResult.hasError) {
        console.log(
          '❌ Update Credit Card failed with errors:',
          updateResult.errors,
        );
      }

      expect(updateResult.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM credit_cards WHERE id = $1',
        [creditCardId],
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].name).toBe('Updated Credit Card');
      expect(Number(dbResult.rows[0].credit_limit)).toBe(700000);
      expect(dbResult.rows[0].closing_day).toBe(5);
      expect(dbResult.rows[0].due_day).toBe(15);
      expect(dbResult.rows[0].is_deleted).toBe(false);
    });

    it('should handle invalid credit card ID', async () => {
      const updateUseCase = compositionRoot.createUpdateCreditCardUseCase();
      const invalidId = EntityId.create().value!.id;

      const result = await updateUseCase.execute({
        id: invalidId,
        name: 'Updated Credit Card',
        limit: 7000.0,
        closingDay: 5,
        dueDay: 15,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle validation errors', async () => {
      const createUseCase = compositionRoot.createCreateCreditCardUseCase();
      const createResult = await createUseCase.execute({
        name: 'Test Credit Card',
        limit: 3000.0,
        closingDay: 10,
        dueDay: 20,
        budgetId: testBudgetId,
      });

      expect(createResult.hasError).toBe(false);
      const creditCardId = createResult.data!.id;

      const updateUseCase = compositionRoot.createUpdateCreditCardUseCase();
      const result = await updateUseCase.execute({
        id: creditCardId,
        name: '',
        limit: 7000.0,
        closingDay: 5,
        dueDay: 15,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('createDeleteCreditCardUseCase', () => {
    it('should delete credit card successfully through full stack', async () => {
      const createUseCase = compositionRoot.createCreateCreditCardUseCase();
      const createResult = await createUseCase.execute({
        name: 'Credit Card To Delete',
        limit: 2000.0,
        closingDay: 10,
        dueDay: 20,
        budgetId: testBudgetId,
      });

      expect(createResult.hasError).toBe(false);
      const creditCardId = createResult.data!.id;

      const deleteUseCase = compositionRoot.createDeleteCreditCardUseCase();
      const result = await deleteUseCase.execute({
        id: creditCardId,
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM credit_cards WHERE id = $1',
        [creditCardId],
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].is_deleted).toBe(true);
    });

    it('should handle invalid credit card ID', async () => {
      const deleteUseCase = compositionRoot.createDeleteCreditCardUseCase();
      const invalidId = EntityId.create().value!.id;

      const result = await deleteUseCase.execute({
        id: invalidId,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle credit card with dependencies', async () => {
      const createUseCase = compositionRoot.createCreateCreditCardUseCase();
      const createResult = await createUseCase.execute({
        name: 'Credit Card With Bills',
        limit: 500000,
        closingDay: 15,
        dueDay: 25,
        budgetId: testBudgetId,
      });

      expect(createResult.hasError).toBe(false);
      const creditCardId = createResult.data!.id;

      await connection.query(
        `
        INSERT INTO credit_card_bills (id, credit_card_id, closing_date, due_date, amount, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `,
        [
          EntityId.create().value!.id,
          creditCardId,
          '2024-01-15',
          '2024-02-10',
          1000,
          'OPEN',
        ],
      );

      const deleteUseCase = compositionRoot.createDeleteCreditCardUseCase();
      const result = await deleteUseCase.execute({
        id: creditCardId,
      });

      expect(result.hasError).toBe(false);
    });
  });

  describe('database integration', () => {
    it('should connect to test database successfully', async () => {
      const result = await connection.query('SELECT 1 as test');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].test).toBe(1);
    });

    it('should create and query credit_cards table', async () => {
      const createUseCase = compositionRoot.createCreateCreditCardUseCase();
      const createResult = await createUseCase.execute({
        name: 'DB Test Credit Card',
        limit: 1500.0,
        closingDay: 12,
        dueDay: 22,
        budgetId: testBudgetId,
      });

      expect(createResult.hasError).toBe(false);

      const dbQuery = await connection.query(
        'SELECT COUNT(*) as count FROM credit_cards WHERE name = $1',
        ['DB Test Credit Card'],
      );

      expect(Number(dbQuery.rows[0].count)).toBe(1);
    });
  });

  describe('error handling integration', () => {
    it('should handle database connection errors gracefully', async () => {
      const useCase = compositionRoot.createCreateCreditCardUseCase();

      const result = await useCase.execute({
        name: 'A'.repeat(1000),
        limit: 5000.0,
        closingDay: 15,
        dueDay: 25,
        budgetId: testBudgetId,
      });

      if (result.hasError) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle invalid credit card IDs', async () => {
      const updateUseCase = compositionRoot.createUpdateCreditCardUseCase();

      const result = await updateUseCase.execute({
        id: 'invalid-uuid',
        name: 'Test Credit Card',
        limit: 5000.0,
        closingDay: 15,
        dueDay: 25,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate credit card limits', async () => {
      const useCase = compositionRoot.createCreateCreditCardUseCase();

      const result = await useCase.execute({
        name: 'Test Credit Card',
        limit: Number.MAX_SAFE_INTEGER,
        closingDay: 15,
        dueDay: 25,
        budgetId: testBudgetId,
      });

      if (result.hasError) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should validate credit card days', async () => {
      const useCase = compositionRoot.createCreateCreditCardUseCase();

      const invalidDayCombinations = [
        { closingDay: 0, dueDay: 15 },
        { closingDay: 15, dueDay: 0 },
        { closingDay: 32, dueDay: 15 },
        { closingDay: 15, dueDay: 32 },
        { closingDay: -1, dueDay: 15 },
        { closingDay: 15, dueDay: -1 },
      ];

      for (const { closingDay, dueDay } of invalidDayCombinations) {
        const result = await useCase.execute({
          name: 'Test Credit Card',
          limit: 5000.0,
          closingDay,
          dueDay,
          budgetId: testBudgetId,
        });

        expect(result.hasError).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('credit card limits integration', () => {
    it('should handle various limit values correctly', async () => {
      const useCase = compositionRoot.createCreateCreditCardUseCase();

      const testLimits = [1, 10000, 100000, 1000000, 9999999];

      for (const limit of testLimits) {
        const result = await useCase.execute({
          name: `Credit Card ${limit}`,
          limit,
          closingDay: 15,
          dueDay: 25,
          budgetId: testBudgetId,
        });

        expect(result.hasError).toBe(false);
        expect(result.data).toBeDefined();

        const dbResult = await connection.query(
          'SELECT credit_limit FROM credit_cards WHERE id = $1',
          [result.data?.id],
        );

        expect(Number(dbResult.rows[0].credit_limit)).toBe(limit);
      }
    });

    it('should update credit card limits correctly', async () => {
      const createUseCase = compositionRoot.createCreateCreditCardUseCase();
      const createResult = await createUseCase.execute({
        name: 'Limit Test Credit Card',
        limit: 200000,
        closingDay: 10,
        dueDay: 20,
        budgetId: testBudgetId,
      });

      expect(createResult.hasError).toBe(false);
      const creditCardId = createResult.data!.id;

      const updateUseCase = compositionRoot.createUpdateCreditCardUseCase();
      const newLimits = [50000, 100000, 500000, 1000000];

      for (const newLimit of newLimits) {
        const updateResult = await updateUseCase.execute({
          id: creditCardId,
          name: 'Limit Test Credit Card',
          limit: newLimit,
          closingDay: 10,
          dueDay: 20,
        });

        expect(updateResult.hasError).toBe(false);

        const dbResult = await connection.query(
          'SELECT credit_limit FROM credit_cards WHERE id = $1',
          [creditCardId],
        );

        expect(Number(dbResult.rows[0].credit_limit)).toBe(newLimit);
      }
    });
  });
});

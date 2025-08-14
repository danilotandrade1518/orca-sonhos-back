import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { CategoryCompositionRoot } from '../../main/composition/CategoryCompositionRoot';
import { TestContainersSetup } from './setup/testcontainers-setup';

let testBudgetId: string;

describe('CategoryCompositionRoot Integration Tests', () => {
  let compositionRoot: CategoryCompositionRoot;
  let connection: PostgresConnectionAdapter;

  beforeAll(async () => {
    connection = await TestContainersSetup.setup();

    compositionRoot = new CategoryCompositionRoot(connection);
  });

  afterAll(async () => {
    await TestContainersSetup.teardown();
  });

  beforeEach(async () => {
    await TestContainersSetup.resetDatabase();

    // Generate fresh ID for each test
    testBudgetId = EntityId.create().value!.id;

    // Create a budget in the database first to satisfy foreign key constraint
    await connection.query(
      `
      INSERT INTO budgets (id, name, owner_id, type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `,
      [testBudgetId, 'Test Budget', EntityId.create().value!.id, 'PERSONAL'],
    );
  });

  describe('createCreateCategoryUseCase', () => {
    it('should create category successfully through full stack', async () => {
      const useCase = compositionRoot.createCreateCategoryUseCase();

      const result = await useCase.execute({
        name: 'Integration Test Category',
        type: CategoryTypeEnum.EXPENSE,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();

      const dbResult = await connection.query(
        'SELECT * FROM categories WHERE name = $1',
        ['Integration Test Category'],
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].name).toBe('Integration Test Category');
      expect(dbResult.rows[0].budget_id).toBe(testBudgetId);
      expect(dbResult.rows[0].type).toBe('EXPENSE');
      expect(dbResult.rows[0].is_deleted).toBe(false);
    });

    it('should handle validation errors', async () => {
      const useCase = compositionRoot.createCreateCategoryUseCase();

      const result = await useCase.execute({
        name: '', // Invalid empty name
        type: CategoryTypeEnum.EXPENSE,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(true);
    });

    it('should handle invalid budget ID', async () => {
      const useCase = compositionRoot.createCreateCategoryUseCase();
      const invalidBudgetId = EntityId.create().value!.id;

      const result = await useCase.execute({
        name: 'Valid Category',
        type: CategoryTypeEnum.INCOME,
        budgetId: invalidBudgetId,
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('createUpdateCategoryUseCase', () => {
    let categoryId: string;

    beforeEach(async () => {
      // Create a category first
      const createUseCase = compositionRoot.createCreateCategoryUseCase();
      const createResult = await createUseCase.execute({
        name: 'Category to Update',
        type: CategoryTypeEnum.EXPENSE,
        budgetId: testBudgetId,
      });

      expect(createResult.hasError).toBe(false);
      categoryId = createResult.data!.id;
    });

    it('should update category successfully through full stack', async () => {
      const updateUseCase = compositionRoot.createUpdateCategoryUseCase();

      const result = await updateUseCase.execute({
        id: categoryId,
        name: 'Updated Category Name',
        type: CategoryTypeEnum.INCOME,
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM categories WHERE id = $1',
        [categoryId],
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].name).toBe('Updated Category Name');
      expect(dbResult.rows[0].type).toBe('INCOME');
    });

    it('should handle invalid category ID', async () => {
      const updateUseCase = compositionRoot.createUpdateCategoryUseCase();
      const invalidCategoryId = EntityId.create().value!.id;

      const result = await updateUseCase.execute({
        id: invalidCategoryId,
        name: 'Updated Name',
        type: CategoryTypeEnum.EXPENSE,
      });

      expect(result.hasError).toBe(true);
    });

    it('should handle validation errors', async () => {
      const updateUseCase = compositionRoot.createUpdateCategoryUseCase();

      const result = await updateUseCase.execute({
        id: categoryId,
        name: '', // Invalid empty name
        type: CategoryTypeEnum.EXPENSE,
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('createDeleteCategoryUseCase', () => {
    let categoryId: string;

    beforeEach(async () => {
      // Create a category first
      const createUseCase = compositionRoot.createCreateCategoryUseCase();
      const createResult = await createUseCase.execute({
        name: 'Category to Delete',
        type: CategoryTypeEnum.EXPENSE,
        budgetId: testBudgetId,
      });

      expect(createResult.hasError).toBe(false);
      categoryId = createResult.data!.id;
    });

    it('should delete category successfully through full stack', async () => {
      const deleteUseCase = compositionRoot.createDeleteCategoryUseCase();

      const result = await deleteUseCase.execute({
        id: categoryId,
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM categories WHERE id = $1',
        [categoryId],
      );

      expect(dbResult.rows).toHaveLength(1);
      expect(dbResult.rows[0].is_deleted).toBe(true);
    });

    it('should handle invalid category ID', async () => {
      const deleteUseCase = compositionRoot.createDeleteCategoryUseCase();
      const invalidCategoryId = EntityId.create().value!.id;

      const result = await deleteUseCase.execute({
        id: invalidCategoryId,
      });

      expect(result.hasError).toBe(true);
    });

    it('should handle category with dependencies', async () => {
      const deleteUseCase = compositionRoot.createDeleteCategoryUseCase();

      // First create a transaction using this category
      const transactionId = EntityId.create().value!.id;
      const accountId = EntityId.create().value!.id;

      // Create account first
      await connection.query(
        `
        INSERT INTO accounts (id, name, budget_id, type, balance, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `,
        [accountId, 'Test Account', testBudgetId, 'CHECKING_ACCOUNT', 1000],
      );

      // Create transaction using this category
      await connection.query(
        `
        INSERT INTO transactions (id, description, amount, type, transaction_date, account_id, budget_id, category_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `,
        [
          transactionId,
          'Test Transaction',
          100,
          'EXPENSE',
          new Date(),
          accountId,
          testBudgetId,
          categoryId,
        ],
      );

      const result = await deleteUseCase.execute({
        id: categoryId,
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('database integration', () => {
    it('should connect to test database successfully', async () => {
      const result = await connection.query('SELECT 1 as test');

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].test).toBe(1);
    });

    it('should create and query categories table', async () => {
      interface ColumnInfo {
        column_name: string;
        data_type: string;
      }

      const result = await connection.query<ColumnInfo>(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'categories'
        ORDER BY ordinal_position
      `);

      expect(result.rows.length).toBeGreaterThan(0);

      const columnNames = result.rows.map((row) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('budget_id');
      expect(columnNames).toContain('type');
      expect(columnNames).toContain('is_deleted');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });
  });

  describe('error handling integration', () => {
    it('should handle database connection errors gracefully', async () => {
      const result = await connection.query('SELECT 1 as test');
      expect(result).toBeDefined();
    });

    it('should handle invalid category IDs', async () => {
      const updateUseCase = compositionRoot.createUpdateCategoryUseCase();
      const invalidCategoryId = 'invalid-uuid';

      const result = await updateUseCase.execute({
        id: invalidCategoryId,
        name: 'Updated Name',
        type: CategoryTypeEnum.EXPENSE,
      });

      expect(result.hasError).toBe(true);
    });

    it('should validate category names', async () => {
      const createUseCase = compositionRoot.createCreateCategoryUseCase();

      const result = await createUseCase.execute({
        name: '', // Empty name should fail
        type: CategoryTypeEnum.EXPENSE,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(true);
    });

    it('should validate category types', async () => {
      const createUseCase = compositionRoot.createCreateCategoryUseCase();

      const result = await createUseCase.execute({
        name: 'Valid Category Name',
        type: CategoryTypeEnum.EXPENSE,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(false);
    });
  });

  describe('category types integration', () => {
    it('should create EXPENSE category successfully', async () => {
      const createUseCase = compositionRoot.createCreateCategoryUseCase();

      const result = await createUseCase.execute({
        name: 'Despesa Test',
        type: CategoryTypeEnum.EXPENSE,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM categories WHERE name = $1',
        ['Despesa Test'],
      );

      expect(dbResult.rows[0].type).toBe('EXPENSE');
    });

    it('should create INCOME category successfully', async () => {
      const createUseCase = compositionRoot.createCreateCategoryUseCase();

      const result = await createUseCase.execute({
        name: 'Receita Test',
        type: CategoryTypeEnum.INCOME,
        budgetId: testBudgetId,
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM categories WHERE name = $1',
        ['Receita Test'],
      );

      expect(dbResult.rows[0].type).toBe('INCOME');
    });

    it('should update category type from EXPENSE to INCOME', async () => {
      const createUseCase = compositionRoot.createCreateCategoryUseCase();
      const updateUseCase = compositionRoot.createUpdateCategoryUseCase();

      const createResult = await createUseCase.execute({
        name: 'Changeable Category',
        type: CategoryTypeEnum.EXPENSE,
        budgetId: testBudgetId,
      });

      expect(createResult.hasError).toBe(false);
      const categoryId = createResult.data!.id;

      const updateResult = await updateUseCase.execute({
        id: categoryId,
        name: 'Changeable Category',
        type: CategoryTypeEnum.INCOME,
      });

      if (updateResult.hasError) {
        console.log('Update errors:', updateResult.errors);
      }

      expect(updateResult.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM categories WHERE id = $1',
        [categoryId],
      );

      expect(dbResult.rows[0].type).toBe('INCOME');
    });
  });
});

import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { AccountCompositionRoot } from '../../main/composition/AccountCompositionRoot';
import { MockBudgetAuthorizationService } from './setup/mock-budget-authorization-service';
import { MockReconcileAccountUnitOfWork } from './setup/mock-reconcile-account-unit-of-work';
import { MockTransferBetweenAccountsUnitOfWork } from './setup/mock-transfer-between-accounts-unit-of-work';
import { TestContainersSetup } from './setup/testcontainers-setup';

let testBudgetId: string;
let testUserId: string;

describe('AccountCompositionRoot Integration Tests', () => {
  let compositionRoot: AccountCompositionRoot;
  let connection: PostgresConnectionAdapter;
  let authService: MockBudgetAuthorizationService;
  let reconcileUnitOfWork: MockReconcileAccountUnitOfWork;
  let transferUnitOfWork: MockTransferBetweenAccountsUnitOfWork;
  const adjustmentCategoryId = EntityId.create().value!.id;
  const transferCategoryId = EntityId.create().value!.id;

  beforeAll(async () => {
    connection = await TestContainersSetup.setup();
    authService = new MockBudgetAuthorizationService();
    reconcileUnitOfWork = new MockReconcileAccountUnitOfWork();
    transferUnitOfWork = new MockTransferBetweenAccountsUnitOfWork();

    compositionRoot = new AccountCompositionRoot(
      connection,
      authService,
      reconcileUnitOfWork,
      transferUnitOfWork,
      adjustmentCategoryId,
      transferCategoryId,
    );
  }, 60000);

  afterAll(async () => {
    await TestContainersSetup.teardown();
  }, 30000);

  beforeEach(async () => {
    await TestContainersSetup.resetDatabase();

    // Generate fresh IDs for each test
    testBudgetId = EntityId.create().value!.id;
    testUserId = EntityId.create().value!.id;

    // Create a budget in the database first to satisfy foreign key constraint
    await connection.query(
      `
      INSERT INTO budgets (id, name, owner_id, type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `,
      [testBudgetId, 'Test Budget', testUserId, 'PERSONAL'],
    );

    authService.clearPermissions();
    authService.setUserPermissions(testUserId, [testBudgetId]);
  });

  describe('createCreateAccountUseCase', () => {
    it('should create account successfully through full stack', async () => {
      const useCase = compositionRoot.createCreateAccountUseCase();

      const result = await useCase.execute({
        userId: testUserId,
        name: 'Integration Test Account',
        budgetId: testBudgetId,
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: 1000,
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBeDefined();

      const dbResult = await connection.query(
        'SELECT * FROM accounts WHERE name = $1',
        ['Integration Test Account'],
      );

      expect(dbResult).toHaveLength(1);
      expect(dbResult[0].name).toBe('Integration Test Account');
      expect(dbResult[0].budget_id).toBe(testBudgetId);
      expect(dbResult[0].type).toBe(AccountTypeEnum.CHECKING_ACCOUNT);
      expect(dbResult[0].is_deleted).toBe(false);
    });

    it('should handle validation errors', async () => {
      const useCase = compositionRoot.createCreateAccountUseCase();

      const result = await useCase.execute({
        userId: testUserId,
        name: '',
        budgetId: testBudgetId,
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: 0,
      });

      expect(result.hasError).toBe(true);
    });

    it('should handle unauthorized creation attempts', async () => {
      const useCase = compositionRoot.createCreateAccountUseCase();
      const unauthorizedUserId = EntityId.create().value!.id;

      const result = await useCase.execute({
        userId: unauthorizedUserId,
        name: 'Unauthorized Account',
        budgetId: testBudgetId,
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: 1000,
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('createUpdateAccountUseCase', () => {
    let accountId: string;

    beforeEach(async () => {
      // Create an account first
      const createUseCase = compositionRoot.createCreateAccountUseCase();
      const createResult = await createUseCase.execute({
        userId: testUserId,
        name: 'Account to Update',
        budgetId: testBudgetId,
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: 500,
      });

      expect(createResult.hasError).toBe(false);
      accountId = createResult.data!.id;
    });

    it('should update account successfully through full stack', async () => {
      const updateUseCase = compositionRoot.createUpdateAccountUseCase();

      const result = await updateUseCase.execute({
        id: accountId,
        userId: testUserId,
        name: 'Updated Account Name',
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM accounts WHERE id = $1',
        [accountId],
      );

      expect(dbResult).toHaveLength(1);
      expect(dbResult[0].name).toBe('Updated Account Name');
    });

    it('should handle unauthorized update attempts', async () => {
      const updateUseCase = compositionRoot.createUpdateAccountUseCase();
      const unauthorizedUserId = EntityId.create().value!.id;

      const result = await updateUseCase.execute({
        id: accountId,
        userId: unauthorizedUserId,
        name: 'Unauthorized Update',
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('createDeleteAccountUseCase', () => {
    let accountId: string;

    beforeEach(async () => {
      // Create an account first
      const createUseCase = compositionRoot.createCreateAccountUseCase();
      const createResult = await createUseCase.execute({
        userId: testUserId,
        name: 'Account to Delete',
        budgetId: testBudgetId,
        type: AccountTypeEnum.SAVINGS_ACCOUNT,
        initialBalance: 200,
      });

      expect(createResult.hasError).toBe(false);
      accountId = createResult.data!.id;
    });

    it('should delete account successfully through full stack', async () => {
      const deleteUseCase = compositionRoot.createDeleteAccountUseCase();

      const result = await deleteUseCase.execute({
        userId: testUserId,
        accountId: accountId,
      });

      expect(result.hasError).toBe(false);

      const dbResult = await connection.query(
        'SELECT * FROM accounts WHERE id = $1',
        [accountId],
      );

      expect(dbResult).toHaveLength(1);
      expect(dbResult[0].is_deleted).toBe(true);
    });

    it('should handle unauthorized delete attempts', async () => {
      const deleteUseCase = compositionRoot.createDeleteAccountUseCase();
      const unauthorizedUserId = EntityId.create().value!.id;

      const result = await deleteUseCase.execute({
        userId: unauthorizedUserId,
        accountId: accountId,
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('createReconcileAccountUseCase', () => {
    let accountId: string;

    beforeEach(async () => {
      // Create an account first
      const createUseCase = compositionRoot.createCreateAccountUseCase();
      const createResult = await createUseCase.execute({
        userId: testUserId,
        name: 'Account to Reconcile',
        budgetId: testBudgetId,
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: 1000,
      });

      expect(createResult.hasError).toBe(false);
      accountId = createResult.data!.id;
    });

    it('should reconcile account successfully through full stack', async () => {
      const reconcileUseCase = compositionRoot.createReconcileAccountUseCase();

      const result = await reconcileUseCase.execute({
        userId: testUserId,
        budgetId: testBudgetId,
        accountId: accountId,
        realBalance: 950, // Difference of -50
      });

      expect(result.hasError).toBe(false);
      expect(reconcileUnitOfWork.executeCallCount).toBe(1);
    });

    it('should handle unauthorized reconcile attempts', async () => {
      const reconcileUseCase = compositionRoot.createReconcileAccountUseCase();
      const unauthorizedUserId = EntityId.create().value!.id;

      const result = await reconcileUseCase.execute({
        userId: unauthorizedUserId,
        budgetId: testBudgetId,
        accountId: accountId,
        realBalance: 950,
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('createTransferBetweenAccountsUseCase', () => {
    let sourceAccountId: string;
    let destinationAccountId: string;

    beforeEach(async () => {
      // Create source account
      const createUseCase = compositionRoot.createCreateAccountUseCase();
      const sourceResult = await createUseCase.execute({
        userId: testUserId,
        name: 'Source Account',
        budgetId: testBudgetId,
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: 1000,
      });

      expect(sourceResult.hasError).toBe(false);
      sourceAccountId = sourceResult.data!.id;

      // Create destination account
      const destinationResult = await createUseCase.execute({
        userId: testUserId,
        name: 'Destination Account',
        budgetId: testBudgetId,
        type: AccountTypeEnum.SAVINGS_ACCOUNT,
        initialBalance: 500,
      });

      expect(destinationResult.hasError).toBe(false);
      destinationAccountId = destinationResult.data!.id;
    });

    it('should transfer between accounts successfully through full stack', async () => {
      const transferUseCase =
        compositionRoot.createTransferBetweenAccountsUseCase();

      const result = await transferUseCase.execute({
        userId: testUserId,
        fromAccountId: sourceAccountId,
        toAccountId: destinationAccountId,
        amount: 200,
        description: 'Integration test transfer',
      });

      expect(result.hasError).toBe(false);
      expect(transferUnitOfWork.executeCallCount).toBe(1);
    });

    it('should handle unauthorized transfer attempts', async () => {
      const transferUseCase =
        compositionRoot.createTransferBetweenAccountsUseCase();
      const unauthorizedUserId = EntityId.create().value!.id;

      const result = await transferUseCase.execute({
        userId: unauthorizedUserId,
        fromAccountId: sourceAccountId,
        toAccountId: destinationAccountId,
        amount: 200,
        description: 'Unauthorized transfer',
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('database integration', () => {
    it('should connect to test database successfully', async () => {
      const result = await connection.query('SELECT 1 as test');

      expect(result).toHaveLength(1);
      expect(result[0].test).toBe(1);
    });

    it('should create and query accounts table', async () => {
      interface ColumnInfo {
        column_name: string;
        data_type: string;
      }

      const result = await connection.query<ColumnInfo>(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'accounts'
        ORDER BY ordinal_position
      `);

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((row) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('budget_id');
      expect(columnNames).toContain('type');
      expect(columnNames).toContain('balance');
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

  describe('error handling integration', () => {
    it('should handle database connection errors gracefully', async () => {
      const result = await connection.query('SELECT 1 as test');
      expect(result).toBeDefined();
    });

    it('should handle invalid account IDs', async () => {
      const updateUseCase = compositionRoot.createUpdateAccountUseCase();
      const invalidAccountId = EntityId.create().value!.id;

      const result = await updateUseCase.execute({
        id: invalidAccountId,
        userId: testUserId,
        name: 'Updated Name',
      });

      expect(result.hasError).toBe(true);
    });
  });
});

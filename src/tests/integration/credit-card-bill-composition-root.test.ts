import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { CreditCardBillCompositionRoot } from '../../main/composition/CreditCardBillCompositionRoot';
import { CreditCardCompositionRoot } from '../../main/composition/CreditCardCompositionRoot';
import { MockBudgetAuthorizationService } from './setup/mock-budget-authorization-service';
import { TestContainersSetup } from './setup/testcontainers-setup';

let testUserId: string;
let testBudgetId: string;
let testCreditCardId: string;
let testAccountId: string;
let paymentCategoryId: string;

describe('CreditCardBillCompositionRoot Integration Tests', () => {
  let connection: PostgresConnectionAdapter;
  let billCompositionRoot: CreditCardBillCompositionRoot;
  let creditCardCompositionRoot: CreditCardCompositionRoot;
  let authService: MockBudgetAuthorizationService;

  beforeAll(async () => {
    connection = await TestContainersSetup.setup();

    authService = new MockBudgetAuthorizationService();

    billCompositionRoot = new CreditCardBillCompositionRoot(
      connection,
      authService,
    );
    creditCardCompositionRoot = new CreditCardCompositionRoot(connection);
  }, 60000);

  afterAll(async () => {
    await TestContainersSetup.teardown();
  }, 30000);

  beforeEach(async () => {
    await TestContainersSetup.resetDatabase();

    testBudgetId = EntityId.create().value!.id;
    testUserId = EntityId.create().value!.id;

    // Seed budget
    await connection.query(
      `INSERT INTO budgets (id, name, owner_id, type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [testBudgetId, 'Budget CC Bill', testUserId, BudgetTypeEnum.PERSONAL],
    );

    // Seed account (simple)
    testAccountId = EntityId.create().value!.id;
    await connection.query(
      `INSERT INTO accounts (id, name, balance, type, budget_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [
        testAccountId,
        'Main Account',
        1000000,
        AccountTypeEnum.CHECKING_ACCOUNT,
        testBudgetId,
      ],
    );

    // Seed category
    paymentCategoryId = EntityId.create().value!.id;
    await connection.query(
      `INSERT INTO categories (id, name, type, budget_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [paymentCategoryId, 'Payment', 'INCOME', testBudgetId],
    );

    // Create credit card via composition root
    const createCardUseCase =
      creditCardCompositionRoot.createCreateCreditCardUseCase();
    const cardResult = await createCardUseCase.execute({
      name: 'Card For Bills',
      limit: 500000,
      closingDay: 10,
      dueDay: 20,
      budgetId: testBudgetId,
    });
    if (cardResult.hasError) throw new Error('Failed to seed credit card');
    testCreditCardId = cardResult.data!.id;

    authService.clearPermissions();
    authService.setUserPermissions(testUserId, [testBudgetId]);
  });

  describe('createCreateCreditCardBillUseCase', () => {
    it('should create credit card bill successfully', async () => {
      const useCase = billCompositionRoot.createCreateCreditCardBillUseCase();
      const result = await useCase.execute({
        creditCardId: testCreditCardId,
        closingDate: new Date('2025-01-10'),
        dueDate: new Date('2025-01-20'),
        amount: 150000, // R$ 1.500,00
      });

      expect(result.hasError).toBe(false);
      expect(result.data?.id).toBeDefined();

      const db = await connection.query(
        'SELECT * FROM credit_card_bills WHERE id = $1',
        [result.data!.id],
      );
      expect(db?.rows[0].credit_card_id).toBe(testCreditCardId);
      expect(Number(db?.rows[0].amount)).toBe(150000);
    });
  });

  describe('createUpdateCreditCardBillUseCase', () => {
    it('should update bill successfully', async () => {
      const create = billCompositionRoot.createCreateCreditCardBillUseCase();
      const created = await create.execute({
        creditCardId: testCreditCardId,
        closingDate: new Date('2025-02-10'),
        dueDate: new Date('2025-02-20'),
        amount: 100000,
      });
      expect(created.hasError).toBe(false);

      const update = billCompositionRoot.createUpdateCreditCardBillUseCase();
      const updateResult = await update.execute({
        id: created.data!.id,
        closingDate: new Date('2025-02-11'),
        dueDate: new Date('2025-02-22'),
        amount: 120000,
      });
      expect(updateResult.hasError).toBe(false);

      const db = await connection.query(
        'SELECT * FROM credit_card_bills WHERE id = $1',
        [created.data!.id],
      );
      expect(Number(db?.rows[0].amount)).toBe(120000);
    });
  });

  describe('createDeleteCreditCardBillUseCase', () => {
    it('should soft delete bill', async () => {
      const create = billCompositionRoot.createCreateCreditCardBillUseCase();
      const created = await create.execute({
        creditCardId: testCreditCardId,
        closingDate: new Date('2025-03-10'),
        dueDate: new Date('2025-03-20'),
        amount: 90000,
      });
      expect(created.hasError).toBe(false);

      const del = billCompositionRoot.createDeleteCreditCardBillUseCase();
      const delResult = await del.execute({ id: created.data!.id });
      expect(delResult.hasError).toBe(false);

      const db = await connection.query(
        'SELECT * FROM credit_card_bills WHERE id = $1',
        [created.data!.id],
      );
      expect(db?.rows[0].is_deleted).toBe(true);
    });
  });

  describe('createReopenCreditCardBillUseCase', () => {
    it('should reopen a paid bill', async () => {
      // Seed a PAID bill directly
      const billId = EntityId.create().value!.id;
      await connection.query(
        `INSERT INTO credit_card_bills (id, credit_card_id, closing_date, due_date, amount, status, paid_at, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'PAID', NOW(), false, NOW(), NOW())`,
        [billId, testCreditCardId, '2025-04-10', '2025-04-20', 50000],
      );

      const reopen = billCompositionRoot.createReopenCreditCardBillUseCase();
      const result = await reopen.execute({
        creditCardBillId: billId,
        userId: testUserId,
        budgetId: testBudgetId,
        justification: 'Need to adjust previous payment',
      });
      expect(result.hasError).toBe(false);

      const db = await connection.query(
        'SELECT status FROM credit_card_bills WHERE id = $1',
        [billId],
      );
      expect(db?.rows[0].status).toBe('OPEN');
    });
  });

  describe('createPayCreditCardBillUseCase', () => {
    it('should pay bill successfully (debit transaction + status update)', async () => {
      // Seed OPEN bill
      const billId = EntityId.create().value!.id;
      await connection.query(
        `INSERT INTO credit_card_bills (id, credit_card_id, closing_date, due_date, amount, status, paid_at, is_deleted, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'OPEN', NULL, false, NOW(), NOW())`,
        [billId, testCreditCardId, '2025-05-10', '2025-05-20', 30000],
      );

      const pay = billCompositionRoot.createPayCreditCardBillUseCase();
      const result = await pay.execute({
        creditCardBillId: billId,
        accountId: testAccountId,
        userId: testUserId,
        budgetId: testBudgetId,
        amount: 30000,
        paymentCategoryId,
      });

      expect(result.hasError).toBe(false);

      const db = await connection.query(
        'SELECT status, paid_at FROM credit_card_bills WHERE id = $1',
        [billId],
      );
      expect(db?.rows[0].status).toBe('PAID');
      expect(db?.rows[0].paid_at).toBeTruthy();
    });
  });
});

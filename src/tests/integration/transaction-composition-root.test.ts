import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { TransactionCompositionRoot } from '@main/composition/TransactionCompositionRoot';

import { PostgresConnectionAdapter } from '../../adapters/postgres/PostgresConnectionAdapter';
import { MockBudgetAuthorizationService } from './setup/mock-budget-authorization-service';
import { TestContainersSetup } from './setup/testcontainers-setup';

let userId: string;
let budgetId: string;
let accountId: string;
let categoryId: string;
let composition: TransactionCompositionRoot;
let connection: PostgresConnectionAdapter;
let auth: MockBudgetAuthorizationService;

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d;
};
const pastDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 5);
  return d;
};

describe('TransactionCompositionRoot (integration)', () => {
  beforeAll(async () => {
    connection = await TestContainersSetup.setup();
    auth = new MockBudgetAuthorizationService();
  });

  afterAll(async () => {
    await TestContainersSetup.teardown();
  });

  beforeEach(async () => {
    await TestContainersSetup.resetDatabase();

    userId = EntityId.create().value!.id;
    budgetId = EntityId.create().value!.id;
    accountId = EntityId.create().value!.id;
    categoryId = EntityId.create().value!.id;

    await connection.query(
      `INSERT INTO budgets (id, name, owner_id, type, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),NOW())`,
      [budgetId, 'Main Budget', userId, 'PERSONAL'],
    );

    await connection.query(
      `INSERT INTO categories (id, name, type, budget_id, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),NOW())`,
      [categoryId, 'General', 'EXPENSE', budgetId],
    );

    await connection.query(
      `INSERT INTO accounts (id, name, type, balance, budget_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
      [accountId, 'Wallet', 'CHECKING_ACCOUNT', 0, budgetId],
    );

    auth.clearPermissions();
    auth.setUserPermissions(userId, [budgetId]);

    composition = new TransactionCompositionRoot(connection, auth);
  });

  const createTransaction = async (
    overrides: Partial<{
      date: Date;
      amount: number;
      type: TransactionTypeEnum;
    }> = {},
  ) => {
    const useCase = composition.createCreateTransactionUseCase();
    const result = await useCase.execute({
      userId,
      budgetId,
      accountId,
      categoryId,
      description: 'Compra mercado',
      amount: overrides.amount ?? 1000,
      type: overrides.type ?? TransactionTypeEnum.EXPENSE,
      transactionDate: overrides.date ?? futureDate(),
    });
    expect(result.hasError).toBe(false);
    return result.data!.id;
  };

  it('should create a scheduled transaction (future date)', async () => {
    const id = await createTransaction();
    const row = await connection.query(
      'SELECT status FROM transactions WHERE id = $1',
      [id],
    );
    expect(row.rows[0].status).toBe(TransactionStatusEnum.SCHEDULED);
  });

  it('should create an overdue transaction (past date)', async () => {
    const id = await createTransaction({ date: pastDate() });
    const row = await connection.query(
      'SELECT status FROM transactions WHERE id = $1',
      [id],
    );
    expect(row.rows[0].status).toBe(TransactionStatusEnum.OVERDUE);
  });

  it('should update a transaction', async () => {
    const id = await createTransaction();
    const update = composition.createUpdateTransactionUseCase();
    const result = await update.execute({
      id,
      userId,
      description: 'Compra feira',
      amount: 2500,
      type: TransactionTypeEnum.EXPENSE,
      accountId,
    });
    expect(result.hasError).toBe(false);
    const row = await connection.query(
      'SELECT description, amount FROM transactions WHERE id = $1',
      [id],
    );
    expect(row.rows[0].description).toBe('Compra feira');
    expect(Number(row.rows[0].amount)).toBe(2500);
  });

  it('should cancel a scheduled future transaction', async () => {
    const id = await createTransaction();
    const cancel = composition.createCancelScheduledTransactionUseCase();
    const result = await cancel.execute({
      userId,
      budgetId,
      transactionId: id,
      cancellationReason: 'Não será mais necessário',
    });

    expect(result.hasError).toBe(false);
    const row = await connection.query(
      'SELECT status, cancellation_reason FROM transactions WHERE id = $1',
      [id],
    );
    expect(row.rows[0].status).toBe(TransactionStatusEnum.CANCELLED);
    expect(row.rows[0].cancellation_reason).toBe('Não será mais necessário');
  });

  it('should mark a past scheduled transaction as late', async () => {
    const manualId = EntityId.create().value!.id;
    const past = pastDate();
    await connection.query(
      `INSERT INTO transactions (id, description, amount, type, account_id, category_id, budget_id, transaction_date, status, is_deleted, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,NOW(),NOW())`,
      [
        manualId,
        'Teste atrasar',
        500,
        'EXPENSE',
        accountId,
        categoryId,
        budgetId,
        past,
        'SCHEDULED',
      ],
    );
    const markLate = composition.createMarkTransactionLateUseCase();
    const lateResult = await markLate.execute({ transactionId: manualId });
    expect(lateResult.hasError).toBe(false);
    const row = await connection.query(
      'SELECT status FROM transactions WHERE id = $1',
      [manualId],
    );
    expect(row.rows[0].status).toBe(TransactionStatusEnum.LATE);
  });

  it('should soft delete a transaction', async () => {
    const id = await createTransaction();
    const del = composition.createDeleteTransactionUseCase();
    const result = await del.execute({ id, userId });
    expect(result.hasError).toBe(false);
    const row = await connection.query(
      'SELECT is_deleted FROM transactions WHERE id = $1',
      [id],
    );
    expect(row.rows[0].is_deleted).toBe(true);
  });

  it('should fail updating non-existent transaction', async () => {
    const update = composition.createUpdateTransactionUseCase();
    const result = await update.execute({
      id: EntityId.create().value!.id,
      userId,
      description: 'X',
      amount: 100,
      type: TransactionTypeEnum.EXPENSE,
      accountId,
    });
    expect(result.hasError).toBe(true);
  });

  it('should not cancel a non-scheduled transaction (already overdue)', async () => {
    const id = await createTransaction({ date: pastDate() });
    const cancel = composition.createCancelScheduledTransactionUseCase();
    const result = await cancel.execute({
      userId,
      budgetId,
      transactionId: id,
      cancellationReason: 'Teste',
    });
    expect(result.hasError).toBe(true);
  });

  it('should not cancel when date already passed (future becomes past)', async () => {
    const manualId = EntityId.create().value!.id;
    const past = pastDate();
    await connection.query(
      `INSERT INTO transactions (id, description, amount, type, account_id, category_id, budget_id, transaction_date, status, is_deleted, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,NOW(),NOW())`,
      [
        manualId,
        'Teste cancel inválido',
        300,
        'EXPENSE',
        accountId,
        categoryId,
        budgetId,
        past,
        'SCHEDULED',
      ],
    );
    const cancel = composition.createCancelScheduledTransactionUseCase();
    const result = await cancel.execute({
      userId,
      budgetId,
      transactionId: manualId,
      cancellationReason: 'Qualquer',
    });
    expect(result.hasError).toBe(true);
  });

  it('should not mark late a non-scheduled transaction (already overdue)', async () => {
    const id = await createTransaction({ date: pastDate() });
    const markLate = composition.createMarkTransactionLateUseCase();
    const result = await markLate.execute({ transactionId: id });
    expect(result.hasError).toBe(true);
  });
});

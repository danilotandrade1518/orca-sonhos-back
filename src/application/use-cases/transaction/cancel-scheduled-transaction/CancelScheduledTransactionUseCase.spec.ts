import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { InvalidCancellationReasonError } from '../../../../domain/aggregates/transaction/errors/InvalidCancellationReasonError';
import { TransactionAlreadyExecutedError } from '../../../../domain/aggregates/transaction/errors/TransactionAlreadyExecutedError';
import { TransactionCannotBeCancelledError } from '../../../../domain/aggregates/transaction/errors/TransactionCannotBeCancelledError';
import { TransactionNotScheduledError } from '../../../../domain/aggregates/transaction/errors/TransactionNotScheduledError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { ScheduledTransactionNotFoundError } from '../../../shared/errors/ScheduledTransactionNotFoundError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetTransactionRepositoryStub } from '../../../shared/tests/stubs/GetTransactionRepositoryStub';
import { SaveTransactionRepositoryStub } from '../../../shared/tests/stubs/SaveTransactionRepositoryStub';
import { CancelScheduledTransactionDto } from './CancelScheduledTransactionDto';
import { CancelScheduledTransactionUseCase } from './CancelScheduledTransactionUseCase';

const createTransaction = (status: TransactionStatusEnum, dateOffset = 1) => {
  const data = {
    description: 'Desc',
    amount: 100,
    type: TransactionTypeEnum.EXPENSE,
    transactionDate: new Date(Date.now() + dateOffset * 86400000),
    categoryId: EntityId.create().value!.id,
    budgetId: EntityId.create().value!.id,
    accountId: EntityId.create().value!.id,
    status,
  };
  const result = Transaction.create(data);
  if (result.hasError) throw new Error('invalid transaction');
  return result.data!;
};

describe('CancelScheduledTransactionUseCase', () => {
  let useCase: CancelScheduledTransactionUseCase;
  let getTransactionRepo: GetTransactionRepositoryStub;
  let cancelRepo: SaveTransactionRepositoryStub;
  let authService: BudgetAuthorizationServiceStub;
  let transaction: Transaction;
  const userId = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;

  beforeEach(() => {
    getTransactionRepo = new GetTransactionRepositoryStub();
    cancelRepo = new SaveTransactionRepositoryStub();
    authService = new BudgetAuthorizationServiceStub();
    useCase = new CancelScheduledTransactionUseCase(
      getTransactionRepo,
      cancelRepo,
      authService,
    );

    transaction = createTransaction(TransactionStatusEnum.SCHEDULED, 2);
    getTransactionRepo.mockTransaction = transaction;
  });

  it('should cancel scheduled transaction', async () => {
    const dto: CancelScheduledTransactionDto = {
      userId,
      budgetId: transaction.budgetId,
      transactionId: transaction.id,
      cancellationReason: 'Change of plans',
    };

    const result = await useCase.execute(dto);

    expect(result.hasData).toBe(true);
    expect(cancelRepo.executeCalls.length).toBe(1);
    expect(transaction.isCancelled).toBe(true);
  });

  it('should return error when transaction not found', async () => {
    getTransactionRepo.mockTransaction = null;
    const dto: CancelScheduledTransactionDto = {
      userId,
      budgetId,
      transactionId: EntityId.create().value!.id,
      cancellationReason: 'any',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new ScheduledTransactionNotFoundError());
  });

  it('should return error when transaction not scheduled', async () => {
    transaction = createTransaction(TransactionStatusEnum.OVERDUE, 2);
    getTransactionRepo.mockTransaction = transaction;
    const dto: CancelScheduledTransactionDto = {
      userId,
      budgetId: transaction.budgetId,
      transactionId: transaction.id,
      cancellationReason: 'reason',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new TransactionNotScheduledError());
  });

  it('should return error when already executed', async () => {
    transaction = createTransaction(TransactionStatusEnum.COMPLETED, 2);
    getTransactionRepo.mockTransaction = transaction;
    const dto: CancelScheduledTransactionDto = {
      userId,
      budgetId: transaction.budgetId,
      transactionId: transaction.id,
      cancellationReason: 'reason',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new TransactionAlreadyExecutedError());
  });

  it('should return error when reason invalid', async () => {
    const dto: CancelScheduledTransactionDto = {
      userId,
      budgetId: transaction.budgetId,
      transactionId: transaction.id,
      cancellationReason: '  ',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InvalidCancellationReasonError());
  });

  it('should return error when execution date not future', async () => {
    transaction = createTransaction(TransactionStatusEnum.SCHEDULED, -1);
    getTransactionRepo.mockTransaction = transaction;
    const dto: CancelScheduledTransactionDto = {
      userId,
      budgetId: transaction.budgetId,
      transactionId: transaction.id,
      cancellationReason: 'reason',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new TransactionCannotBeCancelledError());
  });

  it('should return error when no permission', async () => {
    authService.mockHasAccess = false;
    const dto: CancelScheduledTransactionDto = {
      userId,
      budgetId: transaction.budgetId,
      transactionId: transaction.id,
      cancellationReason: 'reason',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InsufficientPermissionsError());
  });

  it('should return error when persistence fails', async () => {
    cancelRepo.shouldFail = true;
    const dto: CancelScheduledTransactionDto = {
      userId,
      budgetId: transaction.budgetId,
      transactionId: transaction.id,
      cancellationReason: 'reason',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new TransactionPersistenceFailedError());
  });
});

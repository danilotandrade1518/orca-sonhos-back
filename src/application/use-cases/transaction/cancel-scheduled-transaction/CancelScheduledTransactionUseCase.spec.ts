import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionNotFoundError } from '../../../shared/errors/TransactionNotFoundError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetTransactionRepositoryStub } from '../../../shared/tests/stubs/GetTransactionRepositoryStub';
import { SaveTransactionRepositoryStub } from '../../../shared/tests/stubs/SaveTransactionRepositoryStub';
import { CancelScheduledTransactionDto } from './CancelScheduledTransactionDto';
import { CancelScheduledTransactionUseCase } from './CancelScheduledTransactionUseCase';

describe('CancelScheduledTransactionUseCase', () => {
  let useCase: CancelScheduledTransactionUseCase;
  let getTransactionRepositoryStub: GetTransactionRepositoryStub;
  let saveTransactionRepositoryStub: SaveTransactionRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;
  let mockTransaction: Transaction;

  beforeEach(() => {
    getTransactionRepositoryStub = new GetTransactionRepositoryStub();
    saveTransactionRepositoryStub = new SaveTransactionRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();

    const transactionResult = Transaction.create({
      description: 'Test Transaction',
      amount: 100,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(Date.now() + 86400000),
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      accountId: EntityId.create().value!.id,
      status: TransactionStatusEnum.SCHEDULED,
    });

    if (transactionResult.hasError) {
      throw new Error('Failed to create transaction');
    }

    mockTransaction = transactionResult.data!;
    mockTransaction.clearEvents();
    getTransactionRepositoryStub.mockTransaction = mockTransaction;
    budgetAuthorizationServiceStub.mockHasAccess = true;

    useCase = new CancelScheduledTransactionUseCase(
      getTransactionRepositoryStub,
      saveTransactionRepositoryStub,
      budgetAuthorizationServiceStub,
      eventPublisherStub,
    );
  });

  it('should cancel scheduled transaction successfully', async () => {
    const dto: CancelScheduledTransactionDto = {
      id: mockTransaction.id,
      userId: 'user',
      reason: 'Motivo',
    };

    const result = await useCase.execute(dto);

    expect(result.hasData).toBe(true);
    expect(mockTransaction.isCancelled).toBe(true);
    expect(eventPublisherStub.publishManyCalls).toHaveLength(1);
  });

  it('should return error when transaction not found', async () => {
    getTransactionRepositoryStub.shouldReturnNull = true;

    const dto: CancelScheduledTransactionDto = {
      id: 'any',
      userId: 'user',
      reason: 'Motivo',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(TransactionNotFoundError);
  });

  it('should return error when user has no permission', async () => {
    budgetAuthorizationServiceStub.mockHasAccess = false;

    const dto: CancelScheduledTransactionDto = {
      id: mockTransaction.id,
      userId: 'user',
      reason: 'Motivo',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
  });

  it('should return error when save repository fails', async () => {
    saveTransactionRepositoryStub.shouldFail = true;

    const dto: CancelScheduledTransactionDto = {
      id: mockTransaction.id,
      userId: 'user',
      reason: 'Motivo',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(TransactionPersistenceFailedError);
  });

  it('should return error when reason is invalid', async () => {
    const dto: CancelScheduledTransactionDto = {
      id: mockTransaction.id,
      userId: 'user',
      reason: ' ',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
  });
});

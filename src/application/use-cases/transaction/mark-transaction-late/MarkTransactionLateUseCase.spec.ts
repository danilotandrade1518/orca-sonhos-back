import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { TransactionNotFoundError } from '../../../shared/errors/TransactionNotFoundError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { GetTransactionRepositoryStub } from '../../../shared/tests/stubs/GetTransactionRepositoryStub';
import { SaveTransactionRepositoryStub } from '../../../shared/tests/stubs/SaveTransactionRepositoryStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { MarkTransactionLateDto } from './MarkTransactionLateDto';
import { MarkTransactionLateUseCase } from './MarkTransactionLateUseCase';

describe('MarkTransactionLateUseCase', () => {
  let useCase: MarkTransactionLateUseCase;
  let getTransactionRepositoryStub: GetTransactionRepositoryStub;
  let saveTransactionRepositoryStub: SaveTransactionRepositoryStub;
  let eventPublisherStub: EventPublisherStub;
  let transaction: Transaction;

  beforeEach(() => {
    getTransactionRepositoryStub = new GetTransactionRepositoryStub();
    saveTransactionRepositoryStub = new SaveTransactionRepositoryStub();
    eventPublisherStub = new EventPublisherStub();

    const txResult = Transaction.create({
      description: 'test',
      amount: 100,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(Date.now() - 86400000),
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      accountId: EntityId.create().value!.id,
      status: TransactionStatusEnum.SCHEDULED,
    });
    transaction = txResult.data!;
    transaction.clearEvents();
    getTransactionRepositoryStub.mockTransaction = transaction;

    useCase = new MarkTransactionLateUseCase(
      getTransactionRepositoryStub,
      saveTransactionRepositoryStub,
      eventPublisherStub,
    );
  });

  it('should mark transaction as late', async () => {
    const dto: MarkTransactionLateDto = { transactionId: transaction.id };
    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(false);
    expect(saveTransactionRepositoryStub.shouldFail).toBeFalsy();
    expect(transaction.status).toBe(TransactionStatusEnum.LATE);
    expect(eventPublisherStub.publishManyCalls).toHaveLength(1);
  });

  it('should return error when transaction not found', async () => {
    getTransactionRepositoryStub.shouldReturnNull = true;
    const dto: MarkTransactionLateDto = { transactionId: 'non-existent' };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(TransactionNotFoundError);
  });

  it('should return domain error when mark fails', async () => {
    transaction = Transaction.create({
      description: 'test',
      amount: 100,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(Date.now() + 86400000),
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      accountId: EntityId.create().value!.id,
      status: TransactionStatusEnum.SCHEDULED,
    }).data!;
    getTransactionRepositoryStub.mockTransaction = transaction;
    const dto: MarkTransactionLateDto = { transactionId: transaction.id };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
  });

  it('should return error when save fails', async () => {
    saveTransactionRepositoryStub.shouldFail = true;
    const dto: MarkTransactionLateDto = { transactionId: transaction.id };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(TransactionPersistenceFailedError);
  });
});

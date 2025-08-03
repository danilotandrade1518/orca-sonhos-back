import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { EventPublisherStub } from '../../shared/tests/stubs/EventPublisherStub';
import { MarkTransactionLateRepositoryStub } from '../../shared/tests/stubs/MarkTransactionLateRepositoryStub';
import { TransactionSchedulerService } from './TransactionSchedulerService';

describe('TransactionSchedulerService', () => {
  let repository: MarkTransactionLateRepositoryStub;
  let eventPublisher: EventPublisherStub;
  let service: TransactionSchedulerService;

  beforeEach(() => {
    repository = new MarkTransactionLateRepositoryStub();
    eventPublisher = new EventPublisherStub();
    service = new TransactionSchedulerService(repository, eventPublisher);
  });

  it('should mark overdue transactions as late', async () => {
    const tx = Transaction.create({
      description: 'late',
      amount: 100,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(Date.now() - 86400000),
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      accountId: EntityId.create().value!.id,
      status: TransactionStatusEnum.SCHEDULED,
    }).data!;
    repository.overdueTransactions = [tx];

    const result = await service.processLateTransactions();

    expect(result.processed).toHaveLength(1);
    expect(tx.status).toBe(TransactionStatusEnum.LATE);
    expect(repository.saveCalls).toHaveLength(1);
    expect(eventPublisher.publishManyCalls).toHaveLength(1);
  });

  it('should skip transactions when marking fails', async () => {
    const tx = Transaction.create({
      description: 'future',
      amount: 100,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(Date.now() + 86400000),
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      accountId: EntityId.create().value!.id,
      status: TransactionStatusEnum.SCHEDULED,
    }).data!;
    repository.overdueTransactions = [tx];

    const result = await service.processLateTransactions();

    expect(result.processed).toHaveLength(0);
    expect(repository.saveCalls).toHaveLength(0);
    expect(eventPublisher.publishManyCalls).toHaveLength(0);
  });
});

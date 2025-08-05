import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { FindOverdueScheduledTransactionsRepositoryStub } from '../../shared/tests/stubs/FindOverdueScheduledTransactionsRepositoryStub';
import { SaveTransactionRepositoryStub } from '../../shared/tests/stubs/SaveTransactionRepositoryStub';
import { TransactionSchedulerService } from './TransactionSchedulerService';

describe('TransactionSchedulerService', () => {
  let findOverdueRepository: FindOverdueScheduledTransactionsRepositoryStub;
  let saveTransactionRepository: SaveTransactionRepositoryStub;
  let service: TransactionSchedulerService;

  beforeEach(() => {
    findOverdueRepository =
      new FindOverdueScheduledTransactionsRepositoryStub();
    saveTransactionRepository = new SaveTransactionRepositoryStub();
    service = new TransactionSchedulerService(
      findOverdueRepository,
      saveTransactionRepository,
    );
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
    findOverdueRepository.transactions = [tx];

    const result = await service.processLateTransactions();

    expect(result.processed).toHaveLength(1);
    expect(tx.status).toBe(TransactionStatusEnum.LATE);
    expect(saveTransactionRepository.executeCalls).toHaveLength(1);
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
    findOverdueRepository.transactions = [tx];

    const result = await service.processLateTransactions();

    expect(result.processed).toHaveLength(0);
    expect(saveTransactionRepository.executeCalls).toHaveLength(0);
  });
});

import { IFindOverdueScheduledTransactionsRepository } from '../../contracts/repositories/transaction/IFindOverdueScheduledTransactionsRepository';
import { ISaveTransactionRepository } from '../../contracts/repositories/transaction/ISaveTransactionRepository';

export class TransactionSchedulerService {
  constructor(
    private readonly findOverdueRepository: IFindOverdueScheduledTransactionsRepository,
    private readonly saveTransactionRepository: ISaveTransactionRepository,
  ) {}

  async processLateTransactions(date: Date = new Date()) {
    const overdueResult = await this.findOverdueRepository.execute(date);
    if (overdueResult.hasError || !overdueResult.data) {
      return { processed: [] as string[] };
    }

    const processed: string[] = [];
    for (const tx of overdueResult.data) {
      const markResult = tx.markAsLate();
      if (markResult.hasError) continue;

      const saveResult = await this.saveTransactionRepository.execute(tx);
      if (saveResult.hasError) continue;

      processed.push(tx.id);
    }

    return { processed };
  }
}

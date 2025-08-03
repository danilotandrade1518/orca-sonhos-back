import { IEventPublisher } from '../../contracts/events/IEventPublisher';
import { IMarkTransactionLateRepository } from '../../contracts/repositories/transaction/IMarkTransactionLateRepository';

export class TransactionSchedulerService {
  constructor(
    private readonly repository: IMarkTransactionLateRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async processLateTransactions(date: Date = new Date()) {
    const overdueResult = await this.repository.findOverdue(date);
    if (overdueResult.hasError || !overdueResult.data) {
      return { processed: [] as string[] };
    }

    const processed: string[] = [];
    for (const tx of overdueResult.data) {
      const markResult = tx.markAsLate();
      if (markResult.hasError) continue;

      const saveResult = await this.repository.save(tx);
      if (saveResult.hasError) continue;

      const events = tx.getEvents();
      if (events.length > 0) {
        try {
          await this.eventPublisher.publishMany(events);
          tx.clearEvents();
        } catch (error) {
          console.error('Failed to publish events:', error);
        }
      }
      processed.push(tx.id);
    }

    return { processed };
  }
}

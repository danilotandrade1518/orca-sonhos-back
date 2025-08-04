import { Either } from '@either';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IFindOverdueScheduledTransactionsRepository {
  execute(referenceDate: Date): Promise<Either<RepositoryError, Transaction[]>>;
}

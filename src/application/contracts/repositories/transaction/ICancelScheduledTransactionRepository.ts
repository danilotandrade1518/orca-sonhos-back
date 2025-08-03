import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface ICancelScheduledTransactionRepository {
  execute(transaction: Transaction): Promise<Either<RepositoryError, void>>;
}

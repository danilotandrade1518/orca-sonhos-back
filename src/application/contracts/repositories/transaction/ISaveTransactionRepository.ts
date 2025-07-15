import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface ISaveTransactionRepository {
  execute(transaction: Transaction): Promise<Either<RepositoryError, void>>;
}

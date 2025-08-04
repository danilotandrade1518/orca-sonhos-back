import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IMarkTransactionLateRepository {
  findOverdue(date: Date): Promise<Either<RepositoryError, Transaction[]>>;
  save(transaction: Transaction): Promise<Either<RepositoryError, void>>;
}

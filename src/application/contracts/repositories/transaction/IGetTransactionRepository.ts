import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IGetTransactionRepository {
  execute(id: string): Promise<Either<RepositoryError, Transaction | null>>;
}

import { Either } from '@either';

import { Transaction } from '../../../../domain/aggregates/transaction/transaction-entity/Transaction';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IAddTransactionRepository {
  execute(transaction: Transaction): Promise<Either<RepositoryError, void>>;
}

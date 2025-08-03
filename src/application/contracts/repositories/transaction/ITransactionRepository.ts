import { Either } from '@either';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface ITransactionRepository {
  hasByEnvelope(envelopeId: string): Promise<Either<RepositoryError, boolean>>;
}

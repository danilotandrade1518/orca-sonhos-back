import { Either } from '@either';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IHasTransactionByEnvelopeRepository {
  hasTransactionByEnvelope(
    envelopeId: string,
  ): Promise<Either<RepositoryError, boolean>>;
}

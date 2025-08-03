import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { Either } from '@either';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IUpdateEnvelopeRepository {
  execute(envelope: Envelope): Promise<Either<RepositoryError, void>>;
}

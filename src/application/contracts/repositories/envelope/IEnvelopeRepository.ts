import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

export interface IEnvelopeRepository {
  getById(id: string): Promise<Either<RepositoryError, Envelope | null>>;
  save(envelope: Envelope): Promise<Either<RepositoryError, void>>;
}

import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { Either } from '@either';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IGetEnvelopeRepository {
  execute(id: string): Promise<Either<RepositoryError, Envelope | null>>;
  existsByName?(budgetId: string, name: string, excludeId?: string): Promise<Either<RepositoryError, boolean>>;
}

import { Either } from '@either';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IDeleteEnvelopeRepository {
  execute(id: string): Promise<Either<RepositoryError, void>>;
}

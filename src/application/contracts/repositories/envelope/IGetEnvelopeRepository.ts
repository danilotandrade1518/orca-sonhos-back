import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface IGetEnvelopeRepository {
  execute(id: string): Promise<Either<DomainError, Envelope | null>>;
}

import { Either } from '@either';
import { DomainError } from '@domain/shared/DomainError';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';

export interface IAddEnvelopeRepository {
  execute(envelope: Envelope): Promise<Either<DomainError, void>>;
}

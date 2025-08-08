import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface ISaveEnvelopeRepository {
  execute(envelope: Envelope): Promise<Either<DomainError, void>>;
}

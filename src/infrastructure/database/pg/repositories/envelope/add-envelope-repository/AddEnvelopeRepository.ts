import { IAddEnvelopeRepository } from '@application/contracts/repositories/envelope/IAddEnvelopeRepository';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { EnvelopeMapper } from '../../../mappers/envelope/EnvelopeMapper';

class EnvelopePersistenceError extends DomainError {
  protected fieldName: string = 'envelope';

  constructor(message: string) {
    super(message);
  }
}

export class AddEnvelopeRepository implements IAddEnvelopeRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(envelope: Envelope): Promise<Either<DomainError, void>> {
    try {
      const row = EnvelopeMapper.toRow(envelope);

      const query = `
        INSERT INTO envelopes (
          id, name, monthly_limit, budget_id, category_id, 
          is_deleted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const params = [
        row.id,
        row.name,
        row.monthly_limit,
        row.budget_id,
        row.category_id,
        row.is_deleted,
        row.created_at,
        row.updated_at,
      ];

      await this.connection.query(query, params);
      return Either.success<DomainError, void>(undefined);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === '23505') {
        return Either.error(
          new EnvelopePersistenceError(
            `Envelope with id already exists: ${err.message}`,
          ),
        );
      }
      return Either.error(
        new EnvelopePersistenceError(
          `Failed to add envelope: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }
}

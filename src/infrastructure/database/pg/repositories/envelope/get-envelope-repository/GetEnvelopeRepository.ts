import { IGetEnvelopeRepository } from '@application/contracts/repositories/envelope/IGetEnvelopeRepository';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  EnvelopeMapper,
  EnvelopeRow,
} from '../../../mappers/envelope/EnvelopeMapper';

class EnvelopePersistenceError extends DomainError {
  protected fieldName: string = 'envelope';

  constructor(message: string) {
    super(message);
  }
}

export class GetEnvelopeRepository implements IGetEnvelopeRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(id: string): Promise<Either<DomainError, Envelope | null>> {
    try {
      const query = `
        SELECT
          id, name, monthly_limit, budget_id, category_id,
          current_balance, is_deleted, created_at, updated_at
        FROM envelopes
        WHERE id = $1 AND is_deleted = false
      `;

      const queryResultRow = await this.connection.query<EnvelopeRow>(query, [
        id,
      ]);

      const row = queryResultRow?.rows?.[0];

      if (!row) {
        return Either.success<DomainError, Envelope | null>(null);
      }

      const envelopeResult = EnvelopeMapper.toDomain(row);
      if (envelopeResult.hasError) {
        return Either.errors<DomainError, Envelope | null>(
          envelopeResult.errors,
        );
      }

      return Either.success<DomainError, Envelope | null>(envelopeResult.data!);
    } catch (error) {
      return Either.error(
        new EnvelopePersistenceError(
          `Failed to get envelope: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }
}

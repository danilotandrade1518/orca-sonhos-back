import { ISaveEnvelopeRepository } from '@application/contracts/repositories/envelope/ISaveEnvelopeRepository';
import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../../adapters/IPostgresConnectionAdapter';
import { EnvelopeMapper } from '../../../mappers/envelope/EnvelopeMapper';

class EnvelopePersistenceError extends DomainError {
  protected fieldName: string = 'envelope';

  constructor(message: string) {
    super(message);
  }
}

export class SaveEnvelopeRepository implements ISaveEnvelopeRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(envelope: Envelope): Promise<Either<DomainError, void>> {
    const client = await this.connection.getClient();
    const result = await this.executeWithClient(client, envelope);
    client.release();
    return result;
  }

  async executeWithClient(
    client: IDatabaseClient,
    envelope: Envelope,
  ): Promise<Either<DomainError, void>> {
    try {
      const row = EnvelopeMapper.toRow(envelope);

      const query = `
        UPDATE envelopes
        SET 
          name = $2,
          monthly_limit = $3,
          current_balance = $4,
          is_deleted = $5,
          updated_at = $6
        WHERE id = $1
      `;

      const params = [
        row.id,
        row.name,
        row.monthly_limit,
        row.current_balance,
        row.is_deleted,
        row.updated_at,
      ];

      await client.query(query, params);
      return Either.success<DomainError, void>(undefined);
    } catch (error) {
      return Either.error(
        new EnvelopePersistenceError(
          `Failed to save envelope: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ),
      );
    }
  }
}

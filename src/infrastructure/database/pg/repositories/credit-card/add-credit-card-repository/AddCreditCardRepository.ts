import { IAddCreditCardRepository } from '@application/contracts/repositories/credit-card/IAddCreditCardRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { CreditCardMapper } from '../../../mappers/credit-card/CreditCardMapper';

export class AddCreditCardRepository implements IAddCreditCardRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(
    creditCard: CreditCard,
  ): Promise<Either<RepositoryError, void>> {
    try {
      const row = CreditCardMapper.toRow(creditCard);

      const query = `
        INSERT INTO credit_cards (
          id, name, limit, closing_day, due_day, budget_id, 
          is_deleted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      const params = [
        row.id,
        row.name,
        row.limit,
        row.closing_day,
        row.due_day,
        row.budget_id,
        row.is_deleted,
        row.created_at,
        row.updated_at,
      ];

      await this.connection.queryOne(query, params);
      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === '23505') {
        return Either.error(
          new RepositoryError(
            `Credit card with id already exists: ${err.message}`,
            err instanceof Error ? err : new Error('Unknown error'),
          ),
        );
      }
      return Either.error(
        new RepositoryError(
          `Failed to add credit card: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
          err instanceof Error ? err : new Error('Unknown error'),
        ),
      );
    }
  }
}

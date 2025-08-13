import { ISaveCreditCardRepository } from '@application/contracts/repositories/credit-card/ISaveCreditCardRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { CreditCardMapper } from '../../../mappers/credit-card/CreditCardMapper';

export class SaveCreditCardRepository implements ISaveCreditCardRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(
    creditCard: CreditCard,
  ): Promise<Either<RepositoryError, void>> {
    try {
      const row = CreditCardMapper.toRow(creditCard);

      const query = `
        UPDATE credit_cards 
        SET 
          name = $2,
          credit_limit = $3,
          closing_day = $4,
          due_day = $5,
          budget_id = $6,
          is_deleted = $7,
          updated_at = $8
        WHERE id = $1
      `;

      const params = [
        row.id,
        row.name,
        row.credit_limit,
        row.closing_day,
        row.due_day,
        row.budget_id,
        row.is_deleted,
        row.updated_at,
      ];

      await this.connection.query(query, params);

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(`Failed to save credit card: ${err.message}`, err),
      );
    }
  }
}

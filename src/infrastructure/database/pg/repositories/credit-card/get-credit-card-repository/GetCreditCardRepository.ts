import { IGetCreditCardRepository } from '@application/contracts/repositories/credit-card/IGetCreditCardRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  CreditCardMapper,
  CreditCardRow,
} from '../../../mappers/credit-card/CreditCardMapper';

export class GetCreditCardRepository implements IGetCreditCardRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(
    id: string,
  ): Promise<Either<RepositoryError, CreditCard | null>> {
    try {
      const query = `
        SELECT 
          id, name, limit, closing_day, due_day, budget_id,
          is_deleted, created_at, updated_at
        FROM credit_cards 
        WHERE id = $1 AND is_deleted = false
      `;

      const result = await this.connection.queryOne<CreditCardRow>(query, [id]);

      if (!result) {
        return Either.success<RepositoryError, CreditCard | null>(null);
      }

      const creditCardOrError = CreditCardMapper.toDomain(result);
      if (creditCardOrError.hasError) {
        return Either.error(
          new RepositoryError(
            `Failed to map credit card from database: ${creditCardOrError.errors[0].message}`,
            creditCardOrError.errors[0],
          ),
        );
      }

      return Either.success<RepositoryError, CreditCard | null>(
        creditCardOrError.data!,
      );
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(
          `Failed to get credit card by id: ${err.message}`,
          err,
        ),
      );
    }
  }
}

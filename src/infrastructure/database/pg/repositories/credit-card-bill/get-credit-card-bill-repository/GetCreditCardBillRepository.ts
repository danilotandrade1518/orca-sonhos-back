import { IGetCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  CreditCardBillMapper,
  CreditCardBillRow,
} from '../../../mappers/credit-card-bill/CreditCardBillMapper';

export class GetCreditCardBillRepository
  implements IGetCreditCardBillRepository
{
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(
    id: string,
  ): Promise<Either<RepositoryError, CreditCardBill | null>> {
    try {
      const query = `
        SELECT 
          id, credit_card_id, closing_date, due_date, amount, status,
          paid_at, is_deleted, created_at, updated_at
        FROM credit_card_bills 
        WHERE id = $1 AND is_deleted = false
      `;

      const result = await this.connection.queryOne<CreditCardBillRow>(query, [
        id,
      ]);

      if (!result) {
        return Either.success<RepositoryError, CreditCardBill | null>(null);
      }

      const billOrError = CreditCardBillMapper.toDomain(result);
      if (billOrError.hasError) {
        return Either.error(
          new RepositoryError(
            `Failed to map credit card bill from database: ${billOrError.errors[0].message}`,
            billOrError.errors[0],
          ),
        );
      }

      return Either.success<RepositoryError, CreditCardBill | null>(
        billOrError.data!,
      );
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(
          `Failed to get credit card bill by id: ${err.message}`,
          err,
        ),
      );
    }
  }
}

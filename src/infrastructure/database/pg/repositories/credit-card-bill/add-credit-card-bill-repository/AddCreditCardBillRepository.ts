import { IAddCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IAddCreditCardBillRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { CreditCardBillMapper } from '../../../mappers/credit-card-bill/CreditCardBillMapper';

export class AddCreditCardBillRepository
  implements IAddCreditCardBillRepository
{
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(bill: CreditCardBill): Promise<Either<RepositoryError, void>> {
    try {
      const row = CreditCardBillMapper.toRow(bill);

      const query = `
        INSERT INTO credit_card_bills (
          id, credit_card_id, closing_date, due_date, amount, status,
          paid_at, is_deleted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      const params = [
        row.id,
        row.credit_card_id,
        row.closing_date,
        row.due_date,
        row.amount,
        row.status,
        row.paid_at,
        row.is_deleted,
        row.created_at,
        row.updated_at,
      ];

      await this.connection.query(query, params);
      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === '23505') {
        return Either.error(
          new RepositoryError(
            `Credit card bill with id already exists: ${err.message}`,
            err instanceof Error ? err : new Error('Unknown error'),
          ),
        );
      }
      return Either.error(
        new RepositoryError(
          `Failed to add credit card bill: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
          err instanceof Error ? err : new Error('Unknown error'),
        ),
      );
    }
  }
}

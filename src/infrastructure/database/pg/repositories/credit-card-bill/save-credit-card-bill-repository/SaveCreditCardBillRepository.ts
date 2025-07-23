import { ISaveCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/ISaveCreditCardBillRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { CreditCardBillMapper } from '../../../mappers/credit-card-bill/CreditCardBillMapper';

export class SaveCreditCardBillRepository
  implements ISaveCreditCardBillRepository
{
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(bill: CreditCardBill): Promise<Either<RepositoryError, void>> {
    try {
      const row = CreditCardBillMapper.toRow(bill);

      const query = `
        UPDATE credit_card_bills 
        SET 
          closing_date = $2,
          due_date = $3,
          amount = $4,
          status = $5,
          paid_at = $6,
          is_deleted = $7,
          updated_at = $8
        WHERE id = $1
      `;

      const params = [
        row.id,
        row.closing_date,
        row.due_date,
        row.amount,
        row.status,
        row.paid_at,
        row.is_deleted,
        row.updated_at,
      ];

      const result = await this.connection.queryOne(query, params);

      if (!result || result.rowCount === 0) {
        return Either.error(
          new RepositoryError(
            'Credit card bill not found or could not be updated',
          ),
        );
      }

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(
          `Failed to save credit card bill: ${err.message}`,
          err,
        ),
      );
    }
  }
}

import { IDeleteCreditCardBillRepository } from '@application/contracts/repositories/credit-card-bill/IDeleteCreditCardBillRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class DeleteCreditCardBillRepository
  implements IDeleteCreditCardBillRepository
{
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(id: string): Promise<Either<RepositoryError, void>> {
    try {
      const query = `
        UPDATE credit_card_bills 
        SET is_deleted = true, updated_at = NOW()
        WHERE id = $1 AND is_deleted = false
      `;

      const result = await this.connection.queryOne(query, [id]);

      if (!result || result.rowCount === 0) {
        return Either.error(
          new RepositoryError('Credit card bill not found or already deleted'),
        );
      }

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(
          `Failed to delete credit card bill: ${err.message}`,
          err,
        ),
      );
    }
  }
}

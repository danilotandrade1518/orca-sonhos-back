import { IDeleteTransactionRepository } from '@application/contracts/repositories/transaction/IDeleteTransactionRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';

export class DeleteTransactionRepository
  implements IDeleteTransactionRepository
{
  private readonly connection = PostgreSQLConnection.getInstance();

  async execute(id: string): Promise<Either<RepositoryError, void>> {
    try {
      const query = `
        UPDATE transactions
        SET is_deleted = true, updated_at = NOW()
        WHERE id = $1 AND is_deleted = false
      `;

      await this.connection.queryOne(query, [id]);
      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      return Either.error(
        new RepositoryError(
          `Failed to delete transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}

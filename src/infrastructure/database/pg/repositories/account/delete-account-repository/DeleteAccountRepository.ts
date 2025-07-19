import { IDeleteAccountRepository } from '@application/contracts/repositories/account/IDeleteAccountRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';

export class DeleteAccountRepository implements IDeleteAccountRepository {
  private readonly connection = PostgreSQLConnection.getInstance();

  async execute(accountId: string): Promise<Either<RepositoryError, void>> {
    try {
      const query = `
        UPDATE accounts
        SET is_deleted = true, updated_at = NOW()
        WHERE id = $1 AND is_deleted = false
      `;

      await this.connection.queryOne(query, [accountId]);

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      return Either.error(
        new RepositoryError(
          `Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}

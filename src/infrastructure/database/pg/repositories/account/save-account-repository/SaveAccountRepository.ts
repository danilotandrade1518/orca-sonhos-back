import { ISaveAccountRepository } from '@application/contracts/repositories/account/ISaveAccountRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  AccountMapper,
  AccountRow,
} from '../../../mappers/account/AccountMapper';

export class SaveAccountRepository implements ISaveAccountRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(account: Account): Promise<Either<RepositoryError, void>> {
    let row: AccountRow;
    try {
      row = AccountMapper.toRow(account);
      row.updated_at = new Date();
    } catch (error) {
      return Either.error(
        new RepositoryError(
          `Failed to map account: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }

    try {
      const query = `
        UPDATE accounts SET
          name = $2,
          type = $3,
          budget_id = $4,
          balance = $5,
          is_deleted = $6,
          updated_at = $7
        WHERE id = $1
      `;

      const params = [
        row.id,
        row.name,
        row.type,
        row.budget_id,
        row.balance,
        row.is_deleted,
        row.updated_at,
      ];

      await this.connection.queryOne(query, params);
      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      return Either.error(
        new RepositoryError(
          'Database error',
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}

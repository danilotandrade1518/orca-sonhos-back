import { ISaveAccountRepository } from '@application/contracts/repositories/account/ISaveAccountRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Either } from '@either';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import {
  AccountMapper,
  AccountRow,
} from '../../../mappers/account/AccountMapper';

export class SaveAccountRepository implements ISaveAccountRepository {
  private readonly connection = PostgreSQLConnection.getInstance();

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
        INSERT INTO accounts (
          id, name, type, budget_id, balance, is_deleted, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          budget_id = EXCLUDED.budget_id,
          balance = EXCLUDED.balance,
          is_deleted = EXCLUDED.is_deleted,
          updated_at = EXCLUDED.updated_at
      `;

      const params = [
        row.id,
        row.name,
        row.type,
        row.budget_id,
        row.balance,
        row.is_deleted,
        row.created_at,
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

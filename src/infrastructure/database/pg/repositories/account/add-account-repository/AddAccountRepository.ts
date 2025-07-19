import { IAddAccountRepository } from '@application/contracts/repositories/account/IAddAccountRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Either } from '@either';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import { AccountMapper } from '../../../mappers/account/AccountMapper';

export class AddAccountRepository implements IAddAccountRepository {
  async execute(account: Account): Promise<Either<RepositoryError, void>> {
    try {
      const connection = PostgreSQLConnection.getInstance();
      const row = AccountMapper.toRow(account);

      const query = `
        INSERT INTO accounts (
          id, name, type, budget_id, balance, is_deleted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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

      await connection.queryOne(query, params);
      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === '23505') {
        return Either.error(
          new RepositoryError(
            `Account with id already exists: ${err.message}`,
            err instanceof Error ? err : new Error('Unknown error'),
          ),
        );
      }
      return Either.error(
        new RepositoryError(
          `Failed to add account: ${err instanceof Error ? err.message : 'Unknown error'}`,
          err instanceof Error ? err : new Error('Unknown error'),
        ),
      );
    }
  }
}

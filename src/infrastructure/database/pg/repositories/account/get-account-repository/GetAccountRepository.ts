import { IGetAccountRepository } from '@application/contracts/repositories/account/IGetAccountRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  AccountMapper,
  AccountRow,
} from '../../../mappers/account/AccountMapper';

export class GetAccountRepository implements IGetAccountRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(id: string): Promise<Either<RepositoryError, Account | null>> {
    try {
      const query = `
        SELECT
          id,
          name,
          type,
          budget_id,
          balance,
          is_deleted,
          created_at,
          updated_at
        FROM accounts
        WHERE id = $1 AND is_deleted = false
      `;

      const row = await this.connection.queryOne<AccountRow>(query, [id]);

      if (!row) {
        return Either.success<RepositoryError, Account | null>(null);
      }

      const accountResult = AccountMapper.toDomain(row);
      if (accountResult.hasError) {
        return Either.error(
          new RepositoryError(
            `Failed to map account: ${accountResult.errors.map((e) => e.message).join(', ')}`,
            new Error('Mapping error'),
          ),
        );
      }

      return Either.success<RepositoryError, Account | null>(
        accountResult.data!,
      );
    } catch (error) {
      return Either.error(
        new RepositoryError(
          'Failed to get account',
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}

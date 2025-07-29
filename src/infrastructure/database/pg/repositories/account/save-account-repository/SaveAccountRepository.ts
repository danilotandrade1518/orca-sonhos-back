import { ISaveAccountRepository } from '@application/contracts/repositories/account/ISaveAccountRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Either } from '@either';

import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../../adapters/IPostgresConnectionAdapter';
import { AccountMapper } from '../../../mappers/account/AccountMapper';

export class SaveAccountRepository implements ISaveAccountRepository {
  constructor(
    private readonly postgresConnectionAdapter: IPostgresConnectionAdapter,
  ) {}

  public async execute(
    account: Account,
  ): Promise<Either<RepositoryError, void>> {
    const client = await this.postgresConnectionAdapter.getClient();
    const result = await this.executeWithClient(client, account);
    client.release();
    return result;
  }

  public async executeWithClient(
    client: IDatabaseClient,
    account: Account,
  ): Promise<Either<RepositoryError, void>> {
    try {
      const { id, name, type, budget_id, balance, is_deleted } =
        AccountMapper.toRow(account);

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

      await client.query(query, [
        id,
        name,
        type,
        budget_id,
        balance,
        is_deleted,
      ]);

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      return Either.error<RepositoryError, void>(
        new RepositoryError('Failed to save account', error as Error),
      );
    }
  }
}

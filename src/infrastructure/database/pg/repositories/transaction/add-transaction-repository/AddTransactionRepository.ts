import { IAddTransactionRepository } from '@application/contracts/repositories/transaction/IAddTransactionRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../../adapters/IPostgresConnectionAdapter';
import { TransactionMapper } from '../../../mappers/transaction/TransactionMapper';

export class AddTransactionRepository implements IAddTransactionRepository {
  constructor(
    private readonly postgresConnectionAdapter: IPostgresConnectionAdapter,
  ) {}

  public async execute(
    transaction: Transaction,
  ): Promise<Either<RepositoryError, void>> {
    const client = await this.postgresConnectionAdapter.getClient();
    const result = await this.executeWithClient(client, transaction);
    client.release();
    return result;
  }

  public async executeWithClient(
    client: IDatabaseClient,
    transaction: Transaction,
  ): Promise<Either<RepositoryError, void>> {
    try {
      const {
        id,
        description,
        amount,
        type,
        account_id,
        category_id,
        budget_id,
        transaction_date,
        status,
        is_deleted,
      } = TransactionMapper.toRow(transaction);

      const query = `
        INSERT INTO transactions (
          id, description, amount, type, account_id, category_id, 
          budget_id, transaction_date, status, is_deleted, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `;

      await client.query(query, [
        id,
        description,
        amount,
        type,
        account_id,
        category_id,
        budget_id,
        transaction_date,
        status,
        is_deleted,
      ]);

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      return Either.error<RepositoryError, void>(
        new RepositoryError('Failed to add transaction', error as Error),
      );
    }
  }
}

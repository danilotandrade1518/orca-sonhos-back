import { ITransferBetweenAccountsUnitOfWork } from '@application/contracts/unit-of-works/ITransferBetweenAccountsUnitOfWork';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { TransferExecutionError } from '@domain/aggregates/account/errors/TransferExecutionError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../adapters/IPostgresConnectionAdapter';
import { SaveAccountRepository } from '../../repositories/account/save-account-repository/SaveAccountRepository';
import { AddTransactionRepository } from '../../repositories/transaction/add-transaction-repository/AddTransactionRepository';

export class TransferBetweenAccountsUnitOfWork
  implements ITransferBetweenAccountsUnitOfWork
{
  private readonly saveAccountRepository: SaveAccountRepository;
  private readonly addTransactionRepository: AddTransactionRepository;

  constructor(
    private readonly postgresConnectionAdapter: IPostgresConnectionAdapter,
  ) {
    this.saveAccountRepository = new SaveAccountRepository(
      postgresConnectionAdapter,
    );
    this.addTransactionRepository = new AddTransactionRepository(
      postgresConnectionAdapter,
    );
  }

  public async executeTransfer(params: {
    fromAccount: Account;
    toAccount: Account;
    debitTransaction: Transaction;
    creditTransaction: Transaction;
  }): Promise<Either<DomainError, void>> {
    const { fromAccount, toAccount, debitTransaction, creditTransaction } =
      params;

    let client: IDatabaseClient;

    try {
      client = await this.postgresConnectionAdapter.getClient();
      await client.query('BEGIN');

      const saveFromAccountResult =
        await this.saveAccountRepository.executeWithClient(client, fromAccount);

      if (saveFromAccountResult.hasError) {
        await client.query('ROLLBACK');
        client.release();
        return Either.error<DomainError, void>(
          new TransferExecutionError(
            'Failed to save source account: ' +
              saveFromAccountResult.errors[0].message,
          ),
        );
      }

      const saveToAccountResult =
        await this.saveAccountRepository.executeWithClient(client, toAccount);

      if (saveToAccountResult.hasError) {
        await client.query('ROLLBACK');
        client.release();
        return Either.error<DomainError, void>(
          new TransferExecutionError(
            'Failed to save destination account: ' +
              saveToAccountResult.errors[0].message,
          ),
        );
      }

      const addDebitTransactionResult =
        await this.addTransactionRepository.executeWithClient(
          client,
          debitTransaction,
        );

      if (addDebitTransactionResult.hasError) {
        await client.query('ROLLBACK');
        client.release();
        return Either.error<DomainError, void>(
          new TransferExecutionError(
            'Failed to add debit transaction: ' +
              addDebitTransactionResult.errors[0].message,
          ),
        );
      }

      const addCreditTransactionResult =
        await this.addTransactionRepository.executeWithClient(
          client,
          creditTransaction,
        );

      if (addCreditTransactionResult.hasError) {
        await client.query('ROLLBACK');
        client.release();
        return Either.error<DomainError, void>(
          new TransferExecutionError(
            'Failed to add credit transaction: ' +
              addCreditTransactionResult.errors[0].message,
          ),
        );
      }

      await client.query('COMMIT');
      client.release();

      return Either.success<DomainError, void>(undefined);
    } catch (error) {
      if (client!) {
        try {
          await client.query('ROLLBACK');
          client.release();
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', rollbackError);
        }
      }

      return Either.error<DomainError, void>(
        new TransferExecutionError(
          'Unexpected error during transfer execution: ' +
            (error as Error).message,
        ),
      );
    }
  }
}

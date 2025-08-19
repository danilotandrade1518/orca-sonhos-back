import { IReconcileAccountUnitOfWork } from '@application/contracts/unit-of-works/IReconcileAccountUnitOfWork';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { ReconciliationExecutionError } from '@domain/aggregates/account/errors/ReconciliationExecutionError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../adapters/IPostgresConnectionAdapter';
import { SaveAccountRepository } from '../../repositories/account/save-account-repository/SaveAccountRepository';
import { AddTransactionRepository } from '../../repositories/transaction/add-transaction-repository/AddTransactionRepository';
import { logger } from '@shared/logging/logger';
import {
  logMutationStart,
  logMutationEnd,
} from '@shared/observability/mutation-logger';

export class ReconcileAccountUnitOfWork implements IReconcileAccountUnitOfWork {
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

  public async executeReconciliation(params: {
    account: Account;
    transaction: Transaction;
  }): Promise<Either<DomainError | ApplicationError, void>> {
    const { account, transaction } = params;
    const started = process.hrtime.bigint();
    logMutationStart(logger, {
      operation: 'reconcile_account',
      entityType: 'account',
      entityId: account.id,
    });

    let client: IDatabaseClient;

    try {
      client = await this.postgresConnectionAdapter.getClient();
      await client.query('BEGIN');

      const saveAccountResult =
        await this.saveAccountRepository.executeWithClient(client, account);

      if (saveAccountResult.hasError) {
        await client.query('ROLLBACK');
        client.release();
        return Either.error<DomainError | ApplicationError, void>(
          new ReconciliationExecutionError(
            'Failed to save reconciled account: ' +
              saveAccountResult.errors[0].message,
          ),
        );
      }

      const addTransactionResult =
        await this.addTransactionRepository.executeWithClient(
          client,
          transaction,
        );

      if (addTransactionResult.hasError) {
        await client.query('ROLLBACK');
        client.release();
        return Either.error<DomainError | ApplicationError, void>(
          new ReconciliationExecutionError(
            'Failed to add reconciliation transaction: ' +
              addTransactionResult.errors[0].message,
          ),
        );
      }

      await client.query('COMMIT');
      client.release();
      const ended = process.hrtime.bigint();
      logMutationEnd(logger, {
        operation: 'reconcile_account',
        entityType: 'account',
        entityId: account.id,
        durationMs: Number(ended - started) / 1_000_000,
        outcome: 'success',
      });
      return Either.success<DomainError | ApplicationError, void>(undefined);
    } catch (error) {
      if (client!) {
        try {
          await client.query('ROLLBACK');
          client.release();
        } catch (rollbackError) {
          logger.error({
            msg: 'rollback_failure',
            operation: 'reconcile_account',
            error: (rollbackError as Error).message,
          });
        }
      }
      const ended = process.hrtime.bigint();
      logMutationEnd(logger, {
        operation: 'reconcile_account',
        entityType: 'account',
        entityId: account.id,
        durationMs: Number(ended - started) / 1_000_000,
        outcome: 'error',
        errorName: (error as Error).name,
        errorMessage: (error as Error).message,
      });
      return Either.error<DomainError | ApplicationError, void>(
        new ReconciliationExecutionError(
          'Unexpected error during reconciliation execution: ' +
            (error as Error).message,
        ),
      );
    }
  }
}

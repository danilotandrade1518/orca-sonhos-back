import { IPayCreditCardBillUnitOfWork } from '@application/contracts/unit-of-works/IPayCreditCardBillUnitOfWork';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { PaymentExecutionError } from '@domain/aggregates/credit-card-bill/errors/PaymentExecutionError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../adapters/IPostgresConnectionAdapter';
import { SaveCreditCardBillRepository } from '../../repositories/credit-card-bill/save-credit-card-bill-repository/SaveCreditCardBillRepository';
import { AddTransactionRepository } from '../../repositories/transaction/add-transaction-repository/AddTransactionRepository';
import { logger } from '@shared/logging/logger';
import {
  logMutationStart,
  logMutationEnd,
} from '@shared/observability/mutation-logger';

export class PayCreditCardBillUnitOfWork
  implements IPayCreditCardBillUnitOfWork
{
  private readonly saveCreditCardBillRepository: SaveCreditCardBillRepository;
  private readonly addTransactionRepository: AddTransactionRepository;

  constructor(
    private readonly postgresConnectionAdapter: IPostgresConnectionAdapter,
  ) {
    this.saveCreditCardBillRepository = new SaveCreditCardBillRepository(
      postgresConnectionAdapter,
    );
    this.addTransactionRepository = new AddTransactionRepository(
      postgresConnectionAdapter,
    );
  }

  public async executePayment(params: {
    debitTransaction: Transaction;
    bill: CreditCardBill;
  }): Promise<Either<DomainError, void>> {
    const { debitTransaction, bill } = params;
    const started = process.hrtime.bigint();
    logMutationStart(logger, {
      operation: 'pay_credit_card_bill',
      entityType: 'credit_card_bill',
      entityId: bill.id, // assuming getter id
    });

    let client: IDatabaseClient;

    try {
      client = await this.postgresConnectionAdapter.getClient();
      await client.query('BEGIN');

      const addTransactionResult =
        await this.addTransactionRepository.executeWithClient(
          client,
          debitTransaction,
        );

      if (addTransactionResult.hasError) {
        await client.query('ROLLBACK');
        client.release();
        return Either.error<DomainError, void>(
          new PaymentExecutionError(
            'Failed to add payment transaction: ' +
              addTransactionResult.errors[0].message,
          ),
        );
      }

      const saveBillResult =
        await this.saveCreditCardBillRepository.executeWithClient(client, bill);

      if (saveBillResult.hasError) {
        await client.query('ROLLBACK');
        client.release();
        return Either.error<DomainError, void>(
          new PaymentExecutionError(
            'Failed to save credit card bill: ' +
              saveBillResult.errors[0].message,
          ),
        );
      }

      await client.query('COMMIT');
      client.release();
      const ended = process.hrtime.bigint();
      logMutationEnd(logger, {
        operation: 'pay_credit_card_bill',
        entityType: 'credit_card_bill',
        entityId: bill.id,
        durationMs: Number(ended - started) / 1_000_000,
        outcome: 'success',
      });
      return Either.success<DomainError, void>(undefined);
    } catch (error) {
      if (client!) {
        try {
          await client.query('ROLLBACK');
          client.release();
        } catch (rollbackError) {
          logger.error({
            msg: 'rollback_failure',
            operation: 'pay_credit_card_bill',
            error: (rollbackError as Error).message,
          });
        }
      }
      const ended = process.hrtime.bigint();
      logMutationEnd(logger, {
        operation: 'pay_credit_card_bill',
        entityType: 'credit_card_bill',
        entityId: bill.id,
        durationMs: Number(ended - started) / 1_000_000,
        outcome: 'error',
        errorName: (error as Error).name,
        errorMessage: (error as Error).message,
      });
      return Either.error<DomainError, void>(
        new PaymentExecutionError(
          'Unexpected error during payment execution: ' +
            (error as Error).message,
        ),
      );
    }
  }
}

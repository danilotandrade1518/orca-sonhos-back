import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { PaymentExecutionError } from '@domain/aggregates/credit-card-bill/errors/PaymentExecutionError';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { RepositoryError } from '../../../../../application/shared/errors/RepositoryError';
import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../adapters/IPostgresConnectionAdapter';
import { SaveCreditCardBillRepository } from '../../repositories/credit-card-bill/save-credit-card-bill-repository/SaveCreditCardBillRepository';
import { AddTransactionRepository } from '../../repositories/transaction/add-transaction-repository/AddTransactionRepository';
import { PayCreditCardBillUnitOfWork } from './PayCreditCardBillUnitOfWork';

jest.mock(
  '../../repositories/credit-card-bill/save-credit-card-bill-repository/SaveCreditCardBillRepository',
);
jest.mock(
  '../../repositories/transaction/add-transaction-repository/AddTransactionRepository',
);

describe('PayCreditCardBillUnitOfWork', () => {
  let unitOfWork: PayCreditCardBillUnitOfWork;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockClient: jest.Mocked<IDatabaseClient>;
  let mockSaveCreditCardBillRepository: {
    execute: jest.Mock;
    executeWithClient: jest.Mock;
  };
  let mockAddTransactionRepository: {
    execute: jest.Mock;
    executeWithClient: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
    };

    mockSaveCreditCardBillRepository = {
      execute: jest.fn(),
      executeWithClient: jest.fn(),
    };

    mockAddTransactionRepository = {
      execute: jest.fn(),
      executeWithClient: jest.fn(),
    };

    (SaveCreditCardBillRepository as jest.Mock).mockImplementation(() => {
      return mockSaveCreditCardBillRepository;
    });

    (AddTransactionRepository as jest.Mock).mockImplementation(() => {
      return mockAddTransactionRepository;
    });

    unitOfWork = new PayCreditCardBillUnitOfWork(mockConnection);
  });

  const createMockBill = (): CreditCardBill => {
    const billResult = CreditCardBill.restore({
      id: EntityId.create().value!.id,
      creditCardId: EntityId.create().value!.id,
      closingDate: new Date('2025-01-15'),
      dueDate: new Date('2025-02-10'),
      amount: 100000,
      status: BillStatusEnum.PAID,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (billResult.hasError) {
      throw new Error('Failed to create mock bill');
    }
    return billResult.data!;
  };

  const createMockTransaction = (): Transaction => {
    const transactionResult = Transaction.create({
      accountId: EntityId.create().value!.id,
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      amount: 100000,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(),
      description: 'Payment test transaction',
    });

    if (transactionResult.hasError) {
      throw new Error('Failed to create mock transaction');
    }
    return transactionResult.data!;
  };

  const paymentParams = {
    debitTransaction: createMockTransaction(),
    bill: createMockBill(),
  };

  describe('executePayment', () => {
    it('should execute payment successfully', async () => {
      mockSaveCreditCardBillRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );
      mockAddTransactionRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );

      const result = await unitOfWork.executePayment(paymentParams);

      expect(result.hasError).toBe(false);
      expect(mockConnection.getClient).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledWith(mockClient, paymentParams.debitTransaction);

      expect(
        mockSaveCreditCardBillRepository.executeWithClient,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockSaveCreditCardBillRepository.executeWithClient,
      ).toHaveBeenCalledWith(mockClient, paymentParams.bill);
    });

    it('should rollback and return error when adding transaction fails', async () => {
      const error = new RepositoryError('Database error');
      mockAddTransactionRepository.executeWithClient.mockResolvedValue(
        Either.error(error),
      );

      const result = await unitOfWork.executePayment(paymentParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(PaymentExecutionError);
      expect(result.errors[0].message).toContain(
        'Failed to add payment transaction',
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockSaveCreditCardBillRepository.executeWithClient,
      ).not.toHaveBeenCalled();
    });

    it('should rollback and return error when saving bill fails', async () => {
      const error = new RepositoryError('Database error');
      mockAddTransactionRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );
      mockSaveCreditCardBillRepository.executeWithClient.mockResolvedValue(
        Either.error(error),
      );

      const result = await unitOfWork.executePayment(paymentParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(PaymentExecutionError);
      expect(result.errors[0].message).toContain(
        'Failed to save credit card bill',
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockSaveCreditCardBillRepository.executeWithClient,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle rollback failure gracefully', async () => {
      const unexpectedError = new Error('Unexpected error');
      const rollbackError = new Error('Rollback failed');

      mockClient.query
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(rollbackError);

      mockAddTransactionRepository.executeWithClient.mockRejectedValue(
        unexpectedError,
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await unitOfWork.executePayment(paymentParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(PaymentExecutionError);

      const logged = (consoleSpy.mock.calls as unknown[][]).some((c) => {
        try {
          const obj = JSON.parse(c[0] as string);
          return (
            obj.msg === 'rollback_failure' &&
            obj.operation === 'pay_credit_card_bill'
          );
        } catch {
          return false;
        }
      });
      expect(logged).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should handle unexpected errors during execution', async () => {
      const unexpectedError = new Error('Connection failed');
      mockConnection.getClient.mockRejectedValue(unexpectedError);

      const result = await unitOfWork.executePayment(paymentParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(PaymentExecutionError);
      expect(result.errors[0].message).toContain(
        'Unexpected error during payment execution',
      );
      expect(result.errors[0].message).toContain('Connection failed');
    });

    it('should handle case when client is undefined during error handling', async () => {
      const unexpectedError = new Error('Client creation failed');
      mockConnection.getClient.mockImplementation(() => {
        throw unexpectedError;
      });

      const result = await unitOfWork.executePayment(paymentParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(PaymentExecutionError);
      expect(result.errors[0].message).toContain(
        'Unexpected error during payment execution',
      );
      expect(mockClient.query).not.toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).not.toHaveBeenCalled();
    });

    it('should execute operations in correct order', async () => {
      const calls: string[] = [];

      mockConnection.getClient.mockImplementation(async () => {
        calls.push('getClient');
        return mockClient;
      });

      mockClient.query.mockImplementation(async (sql: string) => {
        calls.push(`query:${sql}`);
        return null;
      });

      mockAddTransactionRepository.executeWithClient.mockImplementation(
        async (client, transaction) => {
          calls.push(`addTransaction:${transaction.description}`);
          return Either.success(undefined);
        },
      );

      mockSaveCreditCardBillRepository.executeWithClient.mockImplementation(
        async (client, bill) => {
          calls.push(`saveBill:${bill.id}`);
          return Either.success(undefined);
        },
      );

      mockClient.release.mockImplementation(() => {
        calls.push('release');
      });

      await unitOfWork.executePayment(paymentParams);

      expect(calls).toEqual([
        'getClient',
        'query:BEGIN',
        `addTransaction:${paymentParams.debitTransaction.description}`,
        `saveBill:${paymentParams.bill.id}`,
        'query:COMMIT',
        'release',
      ]);
    });
  });

  describe('constructor', () => {
    it('should create repositories with provided connection adapter', () => {
      const instance = new PayCreditCardBillUnitOfWork(mockConnection);

      expect(SaveCreditCardBillRepository).toHaveBeenCalledWith(mockConnection);
      expect(AddTransactionRepository).toHaveBeenCalledWith(mockConnection);
      expect(instance).toBeInstanceOf(PayCreditCardBillUnitOfWork);
    });
  });
});

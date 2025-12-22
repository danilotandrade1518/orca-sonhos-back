import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { ReconciliationExecutionError } from '@domain/aggregates/account/errors/ReconciliationExecutionError';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../adapters/IPostgresConnectionAdapter';
import { SaveAccountRepository } from '../../repositories/account/save-account-repository/SaveAccountRepository';
import { AddTransactionRepository } from '../../repositories/transaction/add-transaction-repository/AddTransactionRepository';
import { ReconcileAccountUnitOfWork } from './ReconcileAccountUnitOfWork';

jest.mock(
  '../../repositories/account/save-account-repository/SaveAccountRepository',
);
jest.mock(
  '../../repositories/transaction/add-transaction-repository/AddTransactionRepository',
);

describe('ReconcileAccountUnitOfWork', () => {
  let unitOfWork: ReconcileAccountUnitOfWork;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockClient: jest.Mocked<IDatabaseClient>;
  let mockSaveAccountRepository: {
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

    mockSaveAccountRepository = {
      execute: jest.fn(),
      executeWithClient: jest.fn(),
    };

    mockAddTransactionRepository = {
      execute: jest.fn(),
      executeWithClient: jest.fn(),
    };

    (SaveAccountRepository as jest.Mock).mockImplementation(() => {
      return mockSaveAccountRepository;
    });

    (AddTransactionRepository as jest.Mock).mockImplementation(() => {
      return mockAddTransactionRepository;
    });

    unitOfWork = new ReconcileAccountUnitOfWork(mockConnection);
  });

  const createMockAccount = (): Account => {
    const accountResult = Account.create({
      name: 'Test Account',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId: EntityId.create().value!.id,
      initialBalance: 1000,
    });

    if (accountResult.hasError) {
      throw new Error('Failed to create mock account');
    }
    return accountResult.data!;
  };

  const createMockTransaction = (): Transaction => {
    const transactionResult = Transaction.create({
      accountId: EntityId.create().value!.id,
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      amount: 50000,
      type: TransactionTypeEnum.INCOME,
      transactionDate: new Date(),
      description: 'Reconciliation adjustment transaction',
      status: TransactionStatusEnum.COMPLETED,
    });

    if (transactionResult.hasError) {
      throw new Error('Failed to create mock transaction');
    }
    return transactionResult.data!;
  };

  const reconciliationParams = {
    account: createMockAccount(),
    transaction: createMockTransaction(),
  };

  describe('executeReconciliation', () => {
    it('should execute reconciliation successfully', async () => {
      mockSaveAccountRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );
      mockAddTransactionRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );

      const result =
        await unitOfWork.executeReconciliation(reconciliationParams);

      expect(result.hasError).toBe(false);
      expect(mockConnection.getClient).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      expect(mockSaveAccountRepository.executeWithClient).toHaveBeenCalledTimes(
        1,
      );
      expect(mockSaveAccountRepository.executeWithClient).toHaveBeenCalledWith(
        mockClient,
        reconciliationParams.account,
      );

      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledWith(mockClient, reconciliationParams.transaction);
    });

    it('should rollback and return error when saving account fails', async () => {
      const error = new RepositoryError('Database error');
      mockSaveAccountRepository.executeWithClient.mockResolvedValue(
        Either.error(error),
      );

      const result =
        await unitOfWork.executeReconciliation(reconciliationParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(ReconciliationExecutionError);
      expect(result.errors[0].message).toContain(
        'Failed to save reconciled account',
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      expect(mockSaveAccountRepository.executeWithClient).toHaveBeenCalledTimes(
        1,
      );
      expect(
        mockAddTransactionRepository.executeWithClient,
      ).not.toHaveBeenCalled();
    });

    it('should rollback and return error when adding transaction fails', async () => {
      const error = new RepositoryError('Database error');
      mockSaveAccountRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );
      mockAddTransactionRepository.executeWithClient.mockResolvedValue(
        Either.error(error),
      );

      const result =
        await unitOfWork.executeReconciliation(reconciliationParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(ReconciliationExecutionError);
      expect(result.errors[0].message).toContain(
        'Failed to add reconciliation transaction',
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      expect(mockSaveAccountRepository.executeWithClient).toHaveBeenCalledTimes(
        1,
      );
      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle rollback failure gracefully', async () => {
      const unexpectedError = new Error('Unexpected error');
      const rollbackError = new Error('Rollback failed');

      mockClient.query
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(rollbackError);

      mockSaveAccountRepository.executeWithClient.mockRejectedValue(
        unexpectedError,
      );

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result =
        await unitOfWork.executeReconciliation(reconciliationParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(ReconciliationExecutionError);

      const logged = (consoleSpy.mock.calls as unknown[][]).some((c) => {
        try {
          const obj = JSON.parse(c[0] as string);
          return (
            obj.msg === 'rollback_failure' &&
            obj.operation === 'reconcile_account'
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

      const result =
        await unitOfWork.executeReconciliation(reconciliationParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(ReconciliationExecutionError);
      expect(result.errors[0].message).toContain(
        'Unexpected error during reconciliation execution',
      );
      expect(result.errors[0].message).toContain('Connection failed');
    });

    it('should handle case when client is undefined during error handling', async () => {
      const unexpectedError = new Error('Client creation failed');
      mockConnection.getClient.mockImplementation(() => {
        throw unexpectedError;
      });

      const result =
        await unitOfWork.executeReconciliation(reconciliationParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(ReconciliationExecutionError);
      expect(result.errors[0].message).toContain(
        'Unexpected error during reconciliation execution',
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

      mockSaveAccountRepository.executeWithClient.mockImplementation(
        async (client, account) => {
          calls.push(`saveAccount:${account.name}`);
          return Either.success(undefined);
        },
      );

      mockAddTransactionRepository.executeWithClient.mockImplementation(
        async (client, transaction) => {
          calls.push(`addTransaction:${transaction.description}`);
          return Either.success(undefined);
        },
      );

      mockClient.release.mockImplementation(() => {
        calls.push('release');
      });

      await unitOfWork.executeReconciliation(reconciliationParams);

      expect(calls).toEqual([
        'getClient',
        'query:BEGIN',
        `saveAccount:${reconciliationParams.account.name}`,
        `addTransaction:${reconciliationParams.transaction.description}`,
        'query:COMMIT',
        'release',
      ]);
    });
  });

  describe('constructor', () => {
    it('should create repositories with provided connection adapter', () => {
      const instance = new ReconcileAccountUnitOfWork(mockConnection);

      expect(SaveAccountRepository).toHaveBeenCalledWith(mockConnection);
      expect(AddTransactionRepository).toHaveBeenCalledWith(mockConnection);
      expect(instance).toBeInstanceOf(ReconcileAccountUnitOfWork);
    });
  });
});

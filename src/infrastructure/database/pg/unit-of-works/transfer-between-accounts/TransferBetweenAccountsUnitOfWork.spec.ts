import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { TransferExecutionError } from '@domain/aggregates/account/errors/TransferExecutionError';
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
import { TransferBetweenAccountsUnitOfWork } from './TransferBetweenAccountsUnitOfWork';

jest.mock(
  '../../repositories/account/save-account-repository/SaveAccountRepository',
);
jest.mock(
  '../../repositories/transaction/add-transaction-repository/AddTransactionRepository',
);

describe('TransferBetweenAccountsUnitOfWork', () => {
  let unitOfWork: TransferBetweenAccountsUnitOfWork;
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
      queryOne: jest.fn(),
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

    (SaveAccountRepository as jest.Mock).mockImplementation(
      () => mockSaveAccountRepository,
    );
    (AddTransactionRepository as jest.Mock).mockImplementation(
      () => mockAddTransactionRepository,
    );

    unitOfWork = new TransferBetweenAccountsUnitOfWork(mockConnection);
  });

  describe('executeTransfer', () => {
    const budgetId = EntityId.create().value!.id;

    const fromAccount = Account.create({
      name: 'From Account',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId,
    }).data!;

    const toAccount = Account.create({
      name: 'To Account',
      type: AccountTypeEnum.SAVINGS_ACCOUNT,
      budgetId,
    }).data!;

    const debitTransaction = Transaction.create({
      description: 'Transfer Out',
      amount: 200,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date('2024-01-01'),
      categoryId: EntityId.create().value!.id,
      budgetId,
      accountId: fromAccount.id,
      status: TransactionStatusEnum.COMPLETED,
    }).data!;

    const creditTransaction = Transaction.create({
      description: 'Transfer In',
      amount: 200,
      type: TransactionTypeEnum.INCOME,
      transactionDate: new Date('2024-01-01'),
      categoryId: EntityId.create().value!.id,
      budgetId,
      accountId: toAccount.id,
      status: TransactionStatusEnum.COMPLETED,
    }).data!;

    const transferParams = {
      fromAccount,
      toAccount,
      debitTransaction,
      creditTransaction,
    };

    it('should execute transfer successfully', async () => {
      mockSaveAccountRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );
      mockAddTransactionRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );

      const result = await unitOfWork.executeTransfer(transferParams);

      expect(result.hasError).toBe(false);
      expect(mockConnection.getClient).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      expect(mockSaveAccountRepository.executeWithClient).toHaveBeenCalledTimes(
        2,
      );
      expect(mockSaveAccountRepository.executeWithClient).toHaveBeenCalledWith(
        mockClient,
        fromAccount,
      );
      expect(mockSaveAccountRepository.executeWithClient).toHaveBeenCalledWith(
        mockClient,
        toAccount,
      );

      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledWith(mockClient, debitTransaction);
      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledWith(mockClient, creditTransaction);
    });

    it('should rollback and return error when saving from account fails', async () => {
      const error = new RepositoryError('Database error');
      mockSaveAccountRepository.executeWithClient
        .mockResolvedValueOnce(Either.error(error))
        .mockResolvedValue(Either.success(undefined));

      const result = await unitOfWork.executeTransfer(transferParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Failed to save source account',
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

    it('should rollback and return error when saving to account fails', async () => {
      const error = new RepositoryError('Database error');
      mockSaveAccountRepository.executeWithClient
        .mockResolvedValueOnce(Either.success(undefined))
        .mockResolvedValueOnce(Either.error(error));

      const result = await unitOfWork.executeTransfer(transferParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Failed to save destination account',
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      expect(mockSaveAccountRepository.executeWithClient).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockAddTransactionRepository.executeWithClient,
      ).not.toHaveBeenCalled();
    });

    it('should rollback and return error when adding debit transaction fails', async () => {
      const error = new RepositoryError('Database error');
      mockSaveAccountRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );
      mockAddTransactionRepository.executeWithClient
        .mockResolvedValueOnce(Either.error(error))
        .mockResolvedValue(Either.success(undefined));

      const result = await unitOfWork.executeTransfer(transferParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Failed to add debit transaction',
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      expect(mockSaveAccountRepository.executeWithClient).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledTimes(1);
    });

    it('should rollback and return error when adding credit transaction fails', async () => {
      const error = new RepositoryError('Database error');
      mockSaveAccountRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );
      mockAddTransactionRepository.executeWithClient
        .mockResolvedValueOnce(Either.success(undefined))
        .mockResolvedValueOnce(Either.error(error));

      const result = await unitOfWork.executeTransfer(transferParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Failed to add credit transaction',
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);

      expect(mockSaveAccountRepository.executeWithClient).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockAddTransactionRepository.executeWithClient,
      ).toHaveBeenCalledTimes(2);
    });

    it('should handle unexpected errors and rollback transaction', async () => {
      const unexpectedError = new Error('Unexpected database error');
      mockConnection.getClient.mockRejectedValue(unexpectedError);

      const result = await unitOfWork.executeTransfer(transferParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Unexpected error during transfer execution',
      );
      expect(result.errors[0].message).toContain('Unexpected database error');
    });

    it('should handle rollback errors gracefully', async () => {
      const rollbackError = new Error('Rollback failed');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockSaveAccountRepository.executeWithClient.mockResolvedValueOnce(
        Either.error(new RepositoryError('Save failed')),
      );
      mockClient.query.mockImplementation((sql) => {
        if (sql === 'ROLLBACK') {
          throw rollbackError;
        }
        return Promise.resolve([]);
      });

      const result = await unitOfWork.executeTransfer(transferParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransferExecutionError);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to rollback transaction:',
        rollbackError,
      );

      consoleSpy.mockRestore();
    });

    it('should handle case when client is undefined during error handling', async () => {
      const unexpectedError = new Error('Client creation failed');
      mockConnection.getClient.mockImplementation(() => {
        throw unexpectedError;
      });

      const result = await unitOfWork.executeTransfer(transferParams);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Unexpected error during transfer execution',
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
        return [];
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

      await unitOfWork.executeTransfer(transferParams);

      expect(calls).toEqual([
        'getClient',
        'query:BEGIN',
        'saveAccount:From Account',
        'saveAccount:To Account',
        'addTransaction:Transfer Out',
        'addTransaction:Transfer In',
        'query:COMMIT',
        'release',
      ]);
    });
  });

  describe('constructor', () => {
    it('should create repositories with provided connection adapter', () => {
      const instance = new TransferBetweenAccountsUnitOfWork(mockConnection);

      expect(SaveAccountRepository).toHaveBeenCalledWith(mockConnection);
      expect(AddTransactionRepository).toHaveBeenCalledWith(mockConnection);
      expect(instance).toBeInstanceOf(TransferBetweenAccountsUnitOfWork);
    });
  });
});

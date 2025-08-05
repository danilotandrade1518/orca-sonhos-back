import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { TransactionNotFoundError } from '../../../shared/errors/TransactionNotFoundError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { TransactionUpdateFailedError } from '../../../shared/errors/TransactionUpdateFailedError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { GetTransactionRepositoryStub } from '../../../shared/tests/stubs/GetTransactionRepositoryStub';
import { SaveTransactionRepositoryStub } from '../../../shared/tests/stubs/SaveTransactionRepositoryStub';
import { UpdateTransactionDto } from './UpdateTransactionDto';
import { UpdateTransactionUseCase } from './UpdateTransactionUseCase';

describe('UpdateTransactionUseCase', () => {
  let useCase: UpdateTransactionUseCase;
  let getTransactionRepositoryStub: GetTransactionRepositoryStub;
  let saveTransactionRepositoryStub: SaveTransactionRepositoryStub;
  let getAccountRepositoryStub: GetAccountRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let mockTransaction: Transaction;
  let mockAccount: Account;
  const userId = EntityId.create().value!.id;

  beforeEach(() => {
    getTransactionRepositoryStub = new GetTransactionRepositoryStub();
    saveTransactionRepositoryStub = new SaveTransactionRepositoryStub();
    getAccountRepositoryStub = new GetAccountRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();

    const accountResult = Account.create({
      name: 'Test Account',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId: EntityId.create().value!.id,
      initialBalance: 1000,
    });

    if (accountResult.hasError) {
      throw new Error(
        `Failed to create account: ${accountResult.errors.map((e) => e.message).join(', ')}`,
      );
    }

    mockAccount = accountResult.data!;

    const transactionResult = Transaction.create({
      description: 'Original Transaction',
      amount: 100,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(),
      categoryId: EntityId.create().value!.id,
      budgetId: mockAccount.budgetId!,
      accountId: mockAccount.id,
    });

    if (transactionResult.hasError) {
      throw new Error(
        `Failed to create transaction: ${transactionResult.errors.map((e) => e.message).join(', ')}`,
      );
    }

    mockTransaction = transactionResult.data!;

    getTransactionRepositoryStub.mockTransaction = mockTransaction;
    getAccountRepositoryStub.mockAccount = mockAccount;

    useCase = new UpdateTransactionUseCase(
      getTransactionRepositoryStub,
      saveTransactionRepositoryStub,
      getAccountRepositoryStub,
      budgetAuthorizationServiceStub,
    );
  });

  describe('execute', () => {
    it('should update transaction description successfully', async () => {
      const dto: UpdateTransactionDto = {
        userId,
        id: mockTransaction.id,
        description: 'Updated description',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(mockTransaction.id);
    });

    it('should update transaction amount', async () => {
      const dto: UpdateTransactionDto = {
        userId,
        id: mockTransaction.id,
        amount: 200, // Changed amount
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
    });

    it('should update transaction account with correct data', async () => {
      // Create a second account in the same budget
      const secondAccountResult = Account.create({
        name: 'Second Account',
        type: AccountTypeEnum.SAVINGS_ACCOUNT,
        budgetId: mockAccount.budgetId!,
        initialBalance: 500,
      });

      if (secondAccountResult.hasError) {
        throw new Error('Failed to create second account');
      }

      const secondAccount = secondAccountResult.data!;
      getAccountRepositoryStub.mockAccount = secondAccount;

      const dto: UpdateTransactionDto = {
        userId,
        id: mockTransaction.id,
        accountId: secondAccount.id, // Changed account
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
    });

    it('should update multiple fields', async () => {
      const dto: UpdateTransactionDto = {
        userId,
        id: mockTransaction.id,
        amount: 200,
        type: TransactionTypeEnum.INCOME,
        accountId: mockAccount.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
    });

    it('should return error when transaction not found', async () => {
      getTransactionRepositoryStub.shouldReturnNull = true;

      const dto: UpdateTransactionDto = {
        userId,
        id: 'non-existent-id',
        description: 'Updated description',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new TransactionNotFoundError());
    });

    it('should return error when new account does not exist', async () => {
      getAccountRepositoryStub.mockAccount = null;
      getAccountRepositoryStub.executeCalls = [];

      const dto: UpdateTransactionDto = {
        userId,
        id: mockTransaction.id,
        accountId: 'non-existent-account',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new AccountNotFoundError());
    });

    it('should return error when update data is invalid', async () => {
      const dto: UpdateTransactionDto = {
        userId,
        id: mockTransaction.id,
        amount: -100, // Invalid amount
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toBeInstanceOf(TransactionUpdateFailedError);
    });

    it('should return error when getTransaction repository fails', async () => {
      getTransactionRepositoryStub.shouldFail = true;

      const dto: UpdateTransactionDto = {
        userId,
        id: mockTransaction.id,
        description: 'Updated description',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new TransactionNotFoundError());
    });

    it('should return error when saveTransaction repository fails', async () => {
      saveTransactionRepositoryStub.shouldFail = true;

      const dto: UpdateTransactionDto = {
        userId,
        id: mockTransaction.id,
        description: 'Updated description',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new TransactionPersistenceFailedError());
    });

    it('should return error when findAccount repository fails', async () => {
      jest
        .spyOn(getAccountRepositoryStub, 'execute')
        .mockResolvedValueOnce(
          Either.errors([new RepositoryError('Repository error')]),
        );

      const dto: UpdateTransactionDto = {
        userId,
        id: mockTransaction.id,
        accountId: 'new-account-id',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new AccountRepositoryError());
    });
  });
});

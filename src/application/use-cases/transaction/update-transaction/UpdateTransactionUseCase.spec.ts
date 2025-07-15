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
import { FindAccountByIdRepositoryStub } from '../../../shared/tests/stubs/FindAccountByIdRepositoryStub';
import { GetTransactionRepositoryStub } from '../../../shared/tests/stubs/GetTransactionRepositoryStub';
import { SaveTransactionRepositoryStub } from '../../../shared/tests/stubs/SaveTransactionRepositoryStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { UpdateTransactionDto } from './UpdateTransactionDto';
import { UpdateTransactionUseCase } from './UpdateTransactionUseCase';

describe('UpdateTransactionUseCase', () => {
  let useCase: UpdateTransactionUseCase;
  let getTransactionRepositoryStub: GetTransactionRepositoryStub;
  let saveTransactionRepositoryStub: SaveTransactionRepositoryStub;
  let findAccountByIdRepositoryStub: FindAccountByIdRepositoryStub;
  let eventPublisherStub: EventPublisherStub;
  let mockTransaction: Transaction;
  let mockAccount: Account;

  beforeEach(() => {
    getTransactionRepositoryStub = new GetTransactionRepositoryStub();
    saveTransactionRepositoryStub = new SaveTransactionRepositoryStub();
    findAccountByIdRepositoryStub = new FindAccountByIdRepositoryStub();
    eventPublisherStub = new EventPublisherStub();

    const transactionResult = Transaction.create({
      description: 'Original Transaction',
      amount: 100,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(),
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      accountId: EntityId.create().value!.id,
    });

    if (transactionResult.hasError) {
      throw new Error(
        `Failed to create transaction: ${transactionResult.errors.map((e) => e.message).join(', ')}`,
      );
    }

    mockTransaction = transactionResult.data!;

    getTransactionRepositoryStub.mockTransaction = mockTransaction;

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

    findAccountByIdRepositoryStub.addAccount(mockAccount);

    useCase = new UpdateTransactionUseCase(
      getTransactionRepositoryStub,
      saveTransactionRepositoryStub,
      findAccountByIdRepositoryStub,
      eventPublisherStub,
    );
  });

  describe('execute', () => {
    it('should update transaction description successfully', async () => {
      const dto: UpdateTransactionDto = {
        id: mockTransaction.id,
        description: 'Updated description',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(mockTransaction.id);
    });

    it('should update transaction amount and emit event', async () => {
      const dto: UpdateTransactionDto = {
        id: mockTransaction.id,
        amount: 200, // Changed amount
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(eventPublisherStub.publishManyCalls).toHaveLength(1);
    });

    it('should update transaction account and emit event with correct data', async () => {
      const dto: UpdateTransactionDto = {
        id: mockTransaction.id,
        accountId: mockAccount.id, // Changed account
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(eventPublisherStub.publishManyCalls).toHaveLength(1);
    });

    it('should update multiple fields and emit single event', async () => {
      const dto: UpdateTransactionDto = {
        id: mockTransaction.id,
        amount: 200,
        type: TransactionTypeEnum.INCOME,
        accountId: mockAccount.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(eventPublisherStub.publishManyCalls).toHaveLength(1);
    });

    it('should update transaction without emitting events when no relevant changes', async () => {
      const dto: UpdateTransactionDto = {
        id: mockTransaction.id,
        description: 'New description only', // Only description changed
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(eventPublisherStub.publishManyCalls).toHaveLength(0);
    });

    it('should return error when transaction not found', async () => {
      getTransactionRepositoryStub.shouldReturnNull = true;

      const dto: UpdateTransactionDto = {
        id: 'non-existent-id',
        description: 'Updated description',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new TransactionNotFoundError());
    });

    it('should return error when new account does not exist', async () => {
      findAccountByIdRepositoryStub.clear();

      const dto: UpdateTransactionDto = {
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
        .spyOn(findAccountByIdRepositoryStub, 'execute')
        .mockResolvedValueOnce(
          Either.errors([new RepositoryError('Repository error')]),
        );

      const dto: UpdateTransactionDto = {
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

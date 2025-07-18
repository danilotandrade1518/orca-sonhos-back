import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { InvalidTransactionDescriptionError } from '@domain/aggregates/transaction/errors/InvalidTransactionDescriptionError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { AccountsFromDifferentBudgetsError } from '../../../shared/errors/AccountsFromDifferentBudgetsError';
import { InvalidTransferAmountError } from '../../../shared/errors/InvalidTransferAmountError';
import { SameAccountTransferError } from '../../../shared/errors/SameAccountTransferError';
import { TransferTransactionCreationFailedError } from '../../../shared/errors/TransferTransactionCreationFailedError';
import { AddTransactionRepositoryStub } from '../../../shared/tests/stubs/AddTransactionRepositoryStub';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { TransferBetweenAccountsDto } from './TransferBetweenAccountsDto';
process.env.TRANSFER_CATEGORY_ID = EntityId.create().value!.id;
import { TransferBetweenAccountsUseCase } from './TransferBetweenAccountsUseCase';

const createAccounts = (budgetId: string) => {
  const fromResult = Account.create({
    name: 'Conta Origem',
    type: AccountTypeEnum.CHECKING_ACCOUNT,
    budgetId,
    initialBalance: 1000,
  });
  const toResult = Account.create({
    name: 'Conta Destino',
    type: AccountTypeEnum.SAVINGS_ACCOUNT,
    budgetId,
    initialBalance: 500,
  });
  if (fromResult.hasError || toResult.hasError) {
    throw new Error('Failed to create accounts for tests');
  }
  return { from: fromResult.data!, to: toResult.data! };
};

describe('TransferBetweenAccountsUseCase', () => {
  let useCase: TransferBetweenAccountsUseCase;
  let getAccountRepositoryStub: GetAccountRepositoryStub;
  let addTransactionRepositoryStub: AddTransactionRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;
  let fromAccount: Account;
  let toAccount: Account;
  const userId = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;

  beforeEach(() => {
    getAccountRepositoryStub = new GetAccountRepositoryStub();
    addTransactionRepositoryStub = new AddTransactionRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();
    useCase = new TransferBetweenAccountsUseCase(
      getAccountRepositoryStub,
      addTransactionRepositoryStub,
      budgetAuthorizationServiceStub,
      eventPublisherStub,
    );

    const accounts = createAccounts(budgetId);
    fromAccount = accounts.from;
    toAccount = accounts.to;
  });

  const mockRepositorySuccess = () => {
    jest
      .spyOn(getAccountRepositoryStub, 'execute')
      .mockImplementation(async (id: string) => {
        getAccountRepositoryStub.executeCalls.push(id);
        if (id === fromAccount.id) return Either.success(fromAccount);
        if (id === toAccount.id) return Either.success(toAccount);
        return Either.success(null);
      });
  };

  describe('execute', () => {
    it('should transfer successfully between accounts of the same budget', async () => {
      mockRepositorySuccess();

      const spyAdd = jest.spyOn(addTransactionRepositoryStub, 'execute');
      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 200,
        description: 'Pagamento',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(spyAdd).toHaveBeenCalledTimes(2);
      expect(getAccountRepositoryStub.executeCalls).toEqual([
        fromAccount.id,
        toAccount.id,
      ]);
      expect(eventPublisherStub.publishManyCalls.length).toBe(1);
      expect(result.data!.id).toBeDefined();
    });

    it('should return error when origin account not found', async () => {
      jest
        .spyOn(getAccountRepositoryStub, 'execute')
        .mockImplementation(async (id: string) => {
          getAccountRepositoryStub.executeCalls.push(id);
          if (id === fromAccount.id) return Either.success(null);
          return Either.success(toAccount);
        });

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new AccountNotFoundError());
    });

    it('should return error when destination account not found', async () => {
      jest
        .spyOn(getAccountRepositoryStub, 'execute')
        .mockImplementation(async (id: string) => {
          getAccountRepositoryStub.executeCalls.push(id);
          if (id === toAccount.id) return Either.success(null);
          return Either.success(fromAccount);
        });

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new AccountNotFoundError());
    });

    it('should return error when accounts belong to different budgets', async () => {
      const otherBudgetAccounts = createAccounts(EntityId.create().value!.id);
      toAccount = otherBudgetAccounts.to;
      mockRepositorySuccess();

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new AccountsFromDifferentBudgetsError());
    });

    it('should return error when transferring to the same account', async () => {
      jest
        .spyOn(getAccountRepositoryStub, 'execute')
        .mockResolvedValue(Either.success(fromAccount));

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: fromAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new SameAccountTransferError());
    });

    it('should return error when amount is invalid', async () => {
      mockRepositorySuccess();

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 0,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidTransferAmountError());
    });

    it('should return error when user has no permission', async () => {
      mockRepositorySuccess();
      budgetAuthorizationServiceStub.mockHasAccess = false;

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InsufficientPermissionsError());
    });

    it('should return error when creation of first transaction fails', async () => {
      mockRepositorySuccess();
      const createSpy = jest.spyOn(Transaction, 'create');
      const executeSpy = jest.spyOn(addTransactionRepositoryStub, 'execute');
      createSpy.mockReturnValueOnce(
        Either.errors([new InvalidTransactionDescriptionError()]),
      );

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        TransferTransactionCreationFailedError,
      );
      expect(executeSpy).not.toHaveBeenCalled();
      createSpy.mockRestore();
    });

    it('should return error when creation of second transaction fails', async () => {
      mockRepositorySuccess();
      const originalCreate = Transaction.create.bind(Transaction);
      const createSpy = jest.spyOn(Transaction, 'create');
      const executeSpy = jest.spyOn(addTransactionRepositoryStub, 'execute');
      createSpy.mockImplementationOnce(originalCreate);
      createSpy.mockImplementationOnce(() =>
        Either.errors([new InvalidTransactionDescriptionError()]),
      );

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        TransferTransactionCreationFailedError,
      );
      expect(executeSpy).toHaveBeenCalledTimes(0);
      createSpy.mockRestore();
    });

    it('should return error when authorization service fails', async () => {
      mockRepositorySuccess();
      jest
        .spyOn(budgetAuthorizationServiceStub, 'canAccessBudget')
        .mockResolvedValueOnce(
          Either.errors([new RepositoryError('auth error')]),
        );

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
    });

    it('should return error when first transaction persistence fails', async () => {
      mockRepositorySuccess();
      jest
        .spyOn(addTransactionRepositoryStub, 'execute')
        .mockResolvedValueOnce(Either.error(new RepositoryError('fail')));

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new TransactionPersistenceFailedError());
    });

    it('should return error when second transaction persistence fails', async () => {
      mockRepositorySuccess();
      const executeSpy = jest
        .spyOn(addTransactionRepositoryStub, 'execute')
        .mockResolvedValueOnce(Either.success())
        .mockResolvedValueOnce(Either.error(new RepositoryError('fail')));

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new TransactionPersistenceFailedError());
      expect(executeSpy).toHaveBeenCalledTimes(2);
    });

    it('should publish events and clear them on success', async () => {
      mockRepositorySuccess();
      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 50,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      if (result.hasData) {
        const events = eventPublisherStub.publishManyCalls[0];
        expect(events.length).toBeGreaterThan(0);
      }
    });

    it('should handle errors during event publishing gracefully', async () => {
      mockRepositorySuccess();
      jest
        .spyOn(eventPublisherStub, 'publishMany')
        .mockRejectedValueOnce(new Error('fail'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 30,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      consoleSpy.mockRestore();
    });
  });
});

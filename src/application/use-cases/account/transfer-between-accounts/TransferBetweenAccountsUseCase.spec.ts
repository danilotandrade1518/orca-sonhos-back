import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { InsufficientBalanceError } from '../../../../domain/aggregates/account/errors/InsufficientBalanceError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { ITransferBetweenAccountsUnitOfWorkStub } from '../../../shared/tests/stubs/ITransferBetweenAccountsUnitOfWorkStub';
import { TransferBetweenAccountsDto } from './TransferBetweenAccountsDto';
import { TransferBetweenAccountsUseCase } from './TransferBetweenAccountsUseCase';

const TRANSFER_CATEGORY_ID = EntityId.create().value!.id;

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
  let transferUnitOfWorkStub: ITransferBetweenAccountsUnitOfWorkStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let fromAccount: Account;
  let toAccount: Account;
  const userId = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;

  beforeEach(() => {
    getAccountRepositoryStub = new GetAccountRepositoryStub();
    transferUnitOfWorkStub = new ITransferBetweenAccountsUnitOfWorkStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    useCase = new TransferBetweenAccountsUseCase(
      getAccountRepositoryStub,
      transferUnitOfWorkStub,
      budgetAuthorizationServiceStub,
      TRANSFER_CATEGORY_ID,
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

      const spyAdd = jest.spyOn(transferUnitOfWorkStub, 'executeTransfer');
      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 200,
        description: 'Pagamento',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(spyAdd).toHaveBeenCalledTimes(1);
      expect(getAccountRepositoryStub.executeCalls).toEqual([
        fromAccount.id,
        toAccount.id,
      ]);
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

    it('should return error when domain service validation fails', async () => {
      const accountWithInsufficientBalance = Account.create({
        name: 'Conta Poupança com saldo insuficiente',
        type: AccountTypeEnum.SAVINGS_ACCOUNT,
        budgetId,
        initialBalance: 100,
      }).data!;

      jest
        .spyOn(getAccountRepositoryStub, 'execute')
        .mockImplementation(async (id: string) => {
          getAccountRepositoryStub.executeCalls.push(id);
          if (id === accountWithInsufficientBalance.id)
            return Either.success(accountWithInsufficientBalance);
          if (id === toAccount.id) return Either.success(toAccount);
          return Either.success(null);
        });

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: accountWithInsufficientBalance.id,
        toAccountId: toAccount.id,
        amount: 200,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InsufficientBalanceError());
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

    it('should return error when authorization service fails', async () => {
      mockRepositorySuccess();
      jest
        .spyOn(budgetAuthorizationServiceStub, 'canAccessBudget')
        .mockResolvedValueOnce(Either.errors([new AccountRepositoryError()]));

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
        .spyOn(transferUnitOfWorkStub, 'executeTransfer')
        .mockResolvedValueOnce(Either.error(new InsufficientBalanceError()));

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InsufficientBalanceError());
    });

    it('should return error when transfer category ID is invalid', async () => {
      const invalidUseCase = new TransferBetweenAccountsUseCase(
        getAccountRepositoryStub,
        transferUnitOfWorkStub,
        budgetAuthorizationServiceStub,
        'invalid-category-id',
      );

      const dto: TransferBetweenAccountsDto = {
        userId,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 100,
      };

      const result = await invalidUseCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

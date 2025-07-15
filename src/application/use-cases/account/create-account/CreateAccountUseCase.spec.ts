import { InvalidAccountTypeError } from '@domain/aggregates/account/errors/InvalidAccountTypeError';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { InvalidBalanceError } from '@domain/shared/errors/InvalidBalanceError';
import { InvalidEntityIdError } from '@domain/shared/errors/InvalidEntityIdError';
import { InvalidEntityNameError } from '@domain/shared/errors/InvalidEntityNameError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { AddAccountRepositoryStub } from '../../../shared/tests/stubs/AddAccountRepositoryStub';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { CreateAccountDto } from './CreateAccountDto';
import { CreateAccountUseCase } from './CreateAccountUseCase';

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;
  let repositoryStub: AddAccountRepositoryStub;
  let authorizationServiceStub: BudgetAuthorizationServiceStub;
  const userId = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;

  beforeEach(() => {
    repositoryStub = new AddAccountRepositoryStub();
    authorizationServiceStub = new BudgetAuthorizationServiceStub();
    useCase = new CreateAccountUseCase(
      repositoryStub,
      authorizationServiceStub,
    );
  });

  describe('execute', () => {
    it('should create account successfully with valid data', async () => {
      const dto: CreateAccountDto = {
        userId,
        name: 'Conta Corrente Principal',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        initialBalance: 1000,
        description: 'Minha conta principal para gastos do dia a dia',
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBeDefined();
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Conta Corrente Principal',
          type: AccountTypeEnum.CHECKING_ACCOUNT,
        }),
      );
    });

    it('should create account successfully without initial balance', async () => {
      const dto: CreateAccountDto = {
        userId,
        name: 'Conta Poupança',
        type: AccountTypeEnum.SAVINGS_ACCOUNT,
        budgetId,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBeDefined();
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    it('should create account successfully without description', async () => {
      const dto: CreateAccountDto = {
        userId,
        name: 'Carteira Digital',
        type: AccountTypeEnum.DIGITAL_WALLET,
        budgetId,
        initialBalance: 500,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBeDefined();
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    it('should fail when account name is empty', async () => {
      const dto: CreateAccountDto = {
        userId,
        name: '',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when account name is too short', async () => {
      const dto: CreateAccountDto = {
        userId,
        name: 'a',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new InvalidEntityNameError('a'));
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when account type is invalid', async () => {
      const dto: CreateAccountDto = {
        userId,
        name: 'Conta Teste',
        type: 'INVALID_TYPE' as AccountTypeEnum,
        budgetId,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new InvalidAccountTypeError());
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when budgetId is invalid', async () => {
      const dto: CreateAccountDto = {
        userId,
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: 'invalid-uuid',
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(
        new InvalidEntityIdError('invalid-uuid'),
      );
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when initial balance is invalid', async () => {
      const dto: CreateAccountDto = {
        userId,
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        initialBalance: NaN,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new InvalidBalanceError(NaN));
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when repository throws error', async () => {
      const dto: CreateAccountDto = {
        userId,
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        initialBalance: 1000,
      };

      const repositoryError = new RepositoryError('Database connection failed');
      jest
        .spyOn(repositoryStub, 'execute')
        .mockResolvedValueOnce(Either.errors([repositoryError]));

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toBe(repositoryError);
    });

    it('should create different account types successfully', async () => {
      const accountTypes = [
        AccountTypeEnum.CHECKING_ACCOUNT,
        AccountTypeEnum.SAVINGS_ACCOUNT,
        AccountTypeEnum.PHYSICAL_WALLET,
        AccountTypeEnum.DIGITAL_WALLET,
        AccountTypeEnum.INVESTMENT_ACCOUNT,
        AccountTypeEnum.OTHER,
      ];

      const budgetId = EntityId.create().value!.id;

      for (const type of accountTypes) {
        const dto: CreateAccountDto = {
          userId,
          name: `Conta ${type}`,
          type,
          budgetId,
        };

        const result = await useCase.execute(dto);

        expect(result.hasData).toBe(true);
        expect(result.hasError).toBe(false);
        expect(result.data!.id).toBeDefined();
      }
    });
  });
});

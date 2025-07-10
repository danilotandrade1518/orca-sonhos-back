import { InvalidAccountTypeError } from '../errors/InvalidAccountTypeError';
import { AccountTypeEnum } from '../value-objects/account-type/AccountType';
import { InvalidBalanceError } from './../../../shared/errors/InvalidBalanceError';
import { InvalidEntityIdError } from './../../../shared/errors/InvalidEntityIdError';
import { InvalidEntityNameError } from './../../../shared/errors/InvalidEntityNameError';
import { Account, CreateAccountDTO } from './Account';

describe('Account', () => {
  const VALID_BUDGET_ID = '123e4567-e89b-12d3-a456-426614174000';

  describe('create', () => {
    it('should create a valid account with all required data', () => {
      const accountData: CreateAccountDTO = {
        name: 'Conta Corrente Principal',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: VALID_BUDGET_ID,
        initialBalance: 1000,
        description: 'Minha conta principal para gastos do dia a dia',
      };

      const result = Account.create(accountData);

      expect(result.hasError).toBe(false);
      expect(result.data!.name).toBe('Conta Corrente Principal');
      expect(result.data!.type).toBe(AccountTypeEnum.CHECKING_ACCOUNT);
      expect(result.data!.budgetId).toBe(VALID_BUDGET_ID);
      expect(result.data!.balance).toBe(1000);
      expect(result.data!.description).toBe(
        'Minha conta principal para gastos do dia a dia',
      );
      expect(result.data!.id).toBeTruthy();
      expect(result.data!.createdAt).toBeInstanceOf(Date);
      expect(result.data!.updatedAt).toBeInstanceOf(Date);
    });

    it('should create account with zero initial balance when not provided', () => {
      const accountData: CreateAccountDTO = {
        name: 'Conta Poupança',
        type: AccountTypeEnum.SAVINGS_ACCOUNT,
        budgetId: VALID_BUDGET_ID,
      };

      const result = Account.create(accountData);

      expect(result.hasError).toBe(false);
      expect(result.data!.balance).toBe(0);
      expect(result.data!.description).toBeUndefined();
    });

    it('should create account for each type', () => {
      const types = [
        AccountTypeEnum.CHECKING_ACCOUNT,
        AccountTypeEnum.SAVINGS_ACCOUNT,
        AccountTypeEnum.PHYSICAL_WALLET,
        AccountTypeEnum.DIGITAL_WALLET,
        AccountTypeEnum.INVESTMENT_ACCOUNT,
        AccountTypeEnum.OTHER,
      ];

      types.forEach((type) => {
        const result = Account.create({
          name: `Conta ${type}`,
          type,
          budgetId: VALID_BUDGET_ID,
        });

        expect(result.hasError).toBe(false);
        expect(result.data!.type).toBe(type);
      });
    });

    it('should have error when name is invalid', () => {
      const accountData: CreateAccountDTO = {
        name: '',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: VALID_BUDGET_ID,
      };

      const result = Account.create(accountData);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
    });

    it('should have error when type is invalid', () => {
      const accountData: CreateAccountDTO = {
        name: 'Conta Teste',
        type: 'INVALID_TYPE' as AccountTypeEnum,
        budgetId: VALID_BUDGET_ID,
      };

      const result = Account.create(accountData);

      expect(result.hasError).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual(new InvalidAccountTypeError());
    });

    it('should have error when budgetId is invalid', () => {
      const accountData: CreateAccountDTO = {
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: 'invalid-uuid',
      };

      const result = Account.create(accountData);

      expect(result.hasError).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual(
        new InvalidEntityIdError('invalid-uuid'),
      );
    });

    it('should have error when balance is invalid', () => {
      const accountData: CreateAccountDTO = {
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: VALID_BUDGET_ID,
        initialBalance: NaN,
      };

      const result = Account.create(accountData);

      expect(result.hasError).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual(new InvalidBalanceError(NaN));
    });
  });

  describe('updateName', () => {
    it('should update account name successfully', () => {
      const result = Account.create({
        name: 'Nome Original',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: VALID_BUDGET_ID,
      });

      expect(result.hasError).toBe(false);

      const account = result.data!;
      const originalUpdatedAt = account.updatedAt;

      // Wait a moment to ensure timestamp difference
      setTimeout(() => {
        const updateResult = account.updateName('Novo Nome');

        expect(updateResult.hasError).toBe(false);
        expect(account.name).toBe('Novo Nome');
        expect(account.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }, 1);
    });

    it('should have error when updating with invalid name', () => {
      const account = Account.create({
        name: 'Nome Original',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: VALID_BUDGET_ID,
      }).data!;

      const result = account.updateName('');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
      expect(account.name).toBe('Nome Original'); // Nome não deve ter mudado
    });
  });

  describe('updateDescription', () => {
    it('should update description and updateAt', () => {
      const result = Account.create({
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: VALID_BUDGET_ID,
      });

      expect(result.hasError).toBe(false);

      const account = result.data!;
      const originalUpdatedAt = account.updatedAt;

      setTimeout(() => {
        const updateResult = account.updateDescription('Nova descrição');

        expect(updateResult.hasError).toBe(false);
        expect(account.description).toBe('Nova descrição');
        expect(account.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }, 1);
    });

    it('should clear description when undefined is passed', () => {
      const result = Account.create({
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: VALID_BUDGET_ID,
        description: 'Descrição original',
      });

      const account = result.data!;
      const updateResult = account.updateDescription(undefined);

      expect(updateResult.hasError).toBe(false);
      expect(account.description).toBeUndefined();
    });
  });

  describe('Balance Operations', () => {
    let account: Account;

    beforeEach(() => {
      const result = Account.create({
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: VALID_BUDGET_ID,
        initialBalance: 1000,
      });
      account = result.data!;
    });

    describe('addAmount', () => {
      it('should add amount to balance successfully', () => {
        const result = account.addAmount(500);

        expect(result.hasError).toBe(false);
        expect(account.balance).toBe(1500);
      });

      it('should have error when adding invalid amount', () => {
        const result = account.addAmount(NaN);

        expect(result.hasError).toBe(true);
        expect(result.errors[0]).toEqual(new InvalidBalanceError(NaN));
        expect(account.balance).toBe(1000); // Balance should not change
      });
    });

    describe('subtractAmount', () => {
      it('should subtract amount from balance successfully', () => {
        const result = account.subtractAmount(300);

        expect(result.hasError).toBe(false);
        expect(account.balance).toBe(700);
      });

      it('should have error when subtracting invalid amount', () => {
        const result = account.subtractAmount(NaN);

        expect(result.hasError).toBe(true);
        expect(result.errors[0]).toEqual(new InvalidBalanceError(NaN));
        expect(account.balance).toBe(1000); // Balance should not change
      });
    });

    describe('setBalance', () => {
      it('should set new balance successfully', () => {
        const result = account.setBalance(2000);

        expect(result.hasError).toBe(false);
        expect(account.balance).toBe(2000);
      });

      it('should have error when setting invalid balance', () => {
        const result = account.setBalance(NaN);

        expect(result.hasError).toBe(true);
        expect(result.errors[0]).toEqual(new InvalidBalanceError(NaN));
        expect(account.balance).toBe(1000); // Balance should not change
      });
    });

    describe('canSubtract', () => {
      it('should return true when sufficient balance', () => {
        expect(account.canSubtract(500)).toBe(true);
        expect(account.canSubtract(1000)).toBe(true);
      });

      it('should return false when insufficient balance', () => {
        expect(account.canSubtract(1500)).toBe(false);
      });
    });
  });

  describe('Account Types', () => {
    it('should create physical wallet account', () => {
      const result = Account.create({
        name: 'Carteira Física',
        type: AccountTypeEnum.PHYSICAL_WALLET,
        budgetId: VALID_BUDGET_ID,
        initialBalance: 150,
        description: 'Dinheiro em espécie',
      });

      expect(result.hasError).toBe(false);
      expect(result.data!.type).toBe(AccountTypeEnum.PHYSICAL_WALLET);
      expect(result.data!.balance).toBe(150);
    });

    it('should create digital wallet account', () => {
      const result = Account.create({
        name: 'PayPal',
        type: AccountTypeEnum.DIGITAL_WALLET,
        budgetId: VALID_BUDGET_ID,
        initialBalance: 250,
        description: 'Saldo no PayPal',
      });

      expect(result.hasError).toBe(false);
      expect(result.data!.type).toBe(AccountTypeEnum.DIGITAL_WALLET);
      expect(result.data!.balance).toBe(250);
    });

    it('should create investment account', () => {
      const result = Account.create({
        name: 'Tesouro Direto',
        type: AccountTypeEnum.INVESTMENT_ACCOUNT,
        budgetId: VALID_BUDGET_ID,
        initialBalance: 10000,
        description: 'Investimentos em renda fixa',
      });

      expect(result.hasError).toBe(false);
      expect(result.data!.type).toBe(AccountTypeEnum.INVESTMENT_ACCOUNT);
      expect(result.data!.balance).toBe(10000);
    });
  });
});

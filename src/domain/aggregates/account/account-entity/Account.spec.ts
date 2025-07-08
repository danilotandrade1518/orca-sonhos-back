import { Either } from '@either';

import { InvalidAccountTypeError } from '../errors/InvalidAccountTypeError';
import { AccountTypeEnum } from '../value-objects/account-type/AccountType';
import { DomainError } from './../../../shared/DomainError';
import { InvalidBalanceError } from './../../../shared/errors/InvalidBalanceError';
import { InvalidEntityNameError } from './../../../shared/errors/InvalidEntityNameError';
import { Account, CreateAccountDTO } from './Account';

describe('Account', () => {
  describe('create', () => {
    it('should create a valid account with all required data', () => {
      const accountData: CreateAccountDTO = {
        name: 'Conta Corrente Principal',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: 1000,
        description: 'Minha conta principal para gastos do dia a dia',
      };

      const result = Account.create(accountData);

      expect(result.hasError).toBe(false);
      expect(result.data!.name).toBe('Conta Corrente Principal');
      expect(result.data!.type).toBe(AccountTypeEnum.CHECKING_ACCOUNT);
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
        });

        expect(result.hasError).toBe(false);
        expect(result.data!.type).toBe(type);
      });
    });

    it('should have error when name is invalid', () => {
      const accountData: CreateAccountDTO = {
        name: '',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
      };

      const result = Account.create(accountData);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
    });

    it('should have error when type is invalid', () => {
      const accountData: CreateAccountDTO = {
        name: 'Conta Teste',
        type: 'INVALID_TYPE' as AccountTypeEnum,
      };

      const result = Account.create(accountData);

      expect(result.hasError).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual(new InvalidAccountTypeError());
    });

    it('should have error when balance is invalid', () => {
      const accountData: CreateAccountDTO = {
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: NaN,
      };

      const result = Account.create(accountData);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidBalanceError(NaN));
    });
  });

  describe('updateName', () => {
    it('should update account name successfully', () => {
      const result = Account.create({
        name: 'Nome Original',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
      });

      const account = result.data!;
      const originalUpdatedAt = account.updatedAt;

      setTimeout(() => {
        account.updateName('Novo Nome');

        expect(account.name).toBe('Novo Nome');
        expect(account.updatedAt.getTime()).toBeGreaterThan(
          originalUpdatedAt.getTime(),
        );
      }, 1);
    });

    it('should have error when updating to invalid name', () => {
      const account = Account.create({
        name: 'Nome Original',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
      }).data!;

      const result = account.updateName('');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
    });
  });

  describe('updateDescription', () => {
    it('should update account description successfully', () => {
      const result = Account.create({
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
      });

      const account = result.data!;
      account.updateDescription('Nova descrição');

      expect(account.description).toBe('Nova descrição');
    });

    it('should clear description when passing undefined', () => {
      const result = Account.create({
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        description: 'Descrição original',
      });

      const account = result.data!;
      account.updateDescription(undefined);

      expect(account.description).toBeUndefined();
    });
  });

  describe('balance operations', () => {
    let result: Either<DomainError, Account>;
    let account: Account;

    beforeEach(() => {
      result = Account.create({
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        initialBalance: 1000,
      });

      account = result.data!;
    });

    describe('addAmount', () => {
      it('should add amount to balance', () => {
        account.addAmount(500);

        expect(account.balance).toBe(1500);
      });

      it('should handle adding zero', () => {
        account.addAmount(0);

        expect(account.balance).toBe(1000);
      });
    });

    describe('subtractAmount', () => {
      it('should subtract amount from balance', () => {
        account.subtractAmount(300);

        expect(account.balance).toBe(700);
      });

      it('should allow balance to go negative', () => {
        account.subtractAmount(1500);

        expect(result.hasError).toBe(false);
        expect(account.balance).toBe(-500);
      });
    });

    describe('setBalance', () => {
      it('should set new balance', () => {
        account.setBalance(2000);

        expect(account.balance).toBe(2000);
      });

      it('should allow setting negative balance', () => {
        account.setBalance(-100);

        expect(result.hasError).toBe(false);
        expect(account.balance).toBe(-100);
      });
    });

    describe('canSubtract', () => {
      it('should return true when balance is sufficient', () => {
        expect(account.canSubtract(500)).toBe(true);
        expect(account.canSubtract(1000)).toBe(true);
      });

      it('should return false when balance is insufficient', () => {
        expect(account.canSubtract(1500)).toBe(false);
      });

      it('should return true for zero amount', () => {
        expect(account.canSubtract(0)).toBe(true);
      });
    });
  });

  describe('different account types scenarios', () => {
    it('should create physical wallet with cash amount', () => {
      const result = Account.create({
        name: 'Carteira Física',
        type: AccountTypeEnum.PHYSICAL_WALLET,
        initialBalance: 150,
        description: 'Dinheiro em espécie',
      });
      const wallet = result.data!;

      expect(result.hasError).toBe(false);
      expect(wallet.type).toBe(AccountTypeEnum.PHYSICAL_WALLET);
      expect(wallet.balance).toBe(150);
    });

    it('should create digital wallet', () => {
      const result = Account.create({
        name: 'PayPal',
        type: AccountTypeEnum.DIGITAL_WALLET,
        initialBalance: 250,
        description: 'Saldo no PayPal',
      });
      const digitalWallet = result.data!;

      expect(result.hasError).toBe(false);
      expect(digitalWallet.type).toBe(AccountTypeEnum.DIGITAL_WALLET);
    });

    it('should create investment account', () => {
      const result = Account.create({
        name: 'Tesouro Direto',
        type: AccountTypeEnum.INVESTMENT_ACCOUNT,
        initialBalance: 10000,
        description: 'Investimentos em renda fixa',
      });
      const investment = result.data!;

      expect(result.hasError).toBe(false);
      expect(investment.type).toBe(AccountTypeEnum.INVESTMENT_ACCOUNT);
    });
  });
});

import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { DeletedAccountError } from '../errors/DeletedAccountError';
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
      expect(account.name).toBe('Nome Original');
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
        expect(account.balance).toBe(1000);
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
        expect(account.balance).toBe(1000);
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
        expect(account.balance).toBe(1000);
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

  describe('restore', () => {
    it('should restore account from persistence', () => {
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;
      const result = Account.restore({
        id,
        name: 'Acc',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        balance: 200,
        isDeleted: false,
        createdAt,
        updatedAt,
      });

      expect(result.hasError).toBe(false);
      const acc = result.data!;
      expect(acc.id).toBe(id);
      expect(acc.createdAt).toEqual(createdAt);
      expect(acc.updatedAt).toEqual(updatedAt);
      expect(acc.balance).toBe(200);
    });

    it('should return error with invalid data', () => {
      const result = Account.restore({
        id: '',
        name: '',
        type: 'INVALID' as AccountTypeEnum,
        budgetId: '',
        balance: NaN,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(result.hasError).toBe(true);
    });
  });

  describe('Transfer Validation Methods', () => {
    const validBudgetId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

    describe('canTransfer', () => {
      it('should return success for valid transfer amount in checking account', () => {
        const account = Account.create({
          name: 'Test Account',
          type: AccountTypeEnum.CHECKING_ACCOUNT,
          budgetId: validBudgetId,
        });

        if (account.hasError) {
          console.log('Account creation errors:', account.errors);
        }

        expect(account.hasError).toBe(false);

        const canTransferResult = account.data!.canTransfer(100);
        expect(canTransferResult.hasError).toBe(false);
      });

      it('should return error for zero amount', () => {
        const account = Account.create({
          name: 'Test Account',
          type: AccountTypeEnum.CHECKING_ACCOUNT,
          budgetId: validBudgetId,
        });

        const canTransferResult = account.data!.canTransfer(0);
        expect(canTransferResult.hasError).toBe(true);
        expect(canTransferResult.errors[0].message).toBe(
          'Transfer amount must be greater than zero',
        );
      });

      it('should return error for negative amount', () => {
        const account = Account.create({
          name: 'Test Account',
          type: AccountTypeEnum.CHECKING_ACCOUNT,
          budgetId: validBudgetId,
        });

        const canTransferResult = account.data!.canTransfer(-50);
        expect(canTransferResult.hasError).toBe(true);
        expect(canTransferResult.errors[0].message).toBe(
          'Transfer amount must be greater than zero',
        );
      });

      it('should allow overdraft in checking account', () => {
        const account = Account.create({
          name: 'Test Checking',
          type: AccountTypeEnum.CHECKING_ACCOUNT,
          budgetId: validBudgetId,
        });

        const canTransferResult = account.data!.canTransfer(50000);
        expect(canTransferResult.hasError).toBe(false);
      });

      it('should return error for insufficient balance in savings account', () => {
        const account = Account.create({
          name: 'Test Savings',
          type: AccountTypeEnum.SAVINGS_ACCOUNT,
          budgetId: validBudgetId,
        });

        const canTransferResult = account.data!.canTransfer(100);
        expect(canTransferResult.hasError).toBe(true);
      });
    });

    describe('canReceiveTransfer', () => {
      it('should return success for valid transfer amount', () => {
        const account = Account.create({
          name: 'Test Account',
          type: AccountTypeEnum.CHECKING_ACCOUNT,
          budgetId: validBudgetId,
        });

        const canReceiveResult = account.data!.canReceiveTransfer(100);
        expect(canReceiveResult.hasError).toBe(false);
      });

      it('should return error for zero amount', () => {
        const account = Account.create({
          name: 'Test Account',
          type: AccountTypeEnum.CHECKING_ACCOUNT,
          budgetId: validBudgetId,
        });

        const canReceiveResult = account.data!.canReceiveTransfer(0);
        expect(canReceiveResult.hasError).toBe(true);
        expect(canReceiveResult.errors[0].message).toBe(
          'Transfer amount must be greater than zero',
        );
      });

      it('should return error for negative amount', () => {
        const account = Account.create({
          name: 'Test Account',
          type: AccountTypeEnum.CHECKING_ACCOUNT,
          budgetId: validBudgetId,
        });

        const canReceiveResult = account.data!.canReceiveTransfer(-50);
        expect(canReceiveResult.hasError).toBe(true);
        expect(canReceiveResult.errors[0].message).toBe(
          'Transfer amount must be greater than zero',
        );
      });

      it('should return error for deleted account', () => {
        const account = Account.create({
          name: 'Test Account',
          type: AccountTypeEnum.CHECKING_ACCOUNT,
          budgetId: validBudgetId,
        });

        account.data!.delete();

        const canReceiveResult = account.data!.canReceiveTransfer(100);
        expect(canReceiveResult.hasError).toBe(true);
        expect(canReceiveResult.errors[0]).toEqual(new DeletedAccountError());
      });
    });
  });

  describe('reconcile', () => {
    const budgetId = EntityId.create().value!.id;

    it('should reconcile with positive difference', () => {
      const acc = Account.create({
        name: 'Conta Teste',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        initialBalance: 1000,
      }).data!;

      const result = acc.reconcile(1500);
      expect(result.hasError).toBe(false);
      expect(result.data).toBe(500);
      expect(acc.balance).toBe(1500);
    });

    it('should reconcile with negative difference', () => {
      const acc = Account.create({
        name: 'Conta',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        initialBalance: 1000,
      }).data!;

      const result = acc.reconcile(800);
      expect(result.hasError).toBe(false);
      expect(result.data).toBe(-200);
      expect(acc.balance).toBe(800);
    });

    it('should return error when difference below threshold', () => {
      const acc = Account.create({
        name: 'Conta',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        initialBalance: 1000,
      }).data!;

      const result = acc.reconcile(1000);
      expect(result.hasError).toBe(true);
    });
  });
});

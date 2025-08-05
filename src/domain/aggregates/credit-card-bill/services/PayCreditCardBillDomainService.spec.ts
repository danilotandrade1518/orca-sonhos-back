import { PayCreditCardBillDomainService } from './PayCreditCardBillDomainService';
import { CreditCardBill } from '../credit-card-bill-entity/CreditCardBill';
import { Account } from '../../account/account-entity/Account';
import { BillStatusEnum } from '../value-objects/bill-status/BillStatus';
import { AccountTypeEnum } from '../../account/value-objects/account-type/AccountType';
import { CreditCardBillAlreadyDeletedError } from '../errors/CreditCardBillAlreadyDeletedError';
import { InsufficientBalanceError } from '../../account/errors/InsufficientBalanceError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';

describe('PayCreditCardBillDomainService', () => {
  let sut: PayCreditCardBillDomainService;
  let validBill: CreditCardBill;
  let validAccount: Account;
  const budgetId = EntityId.create().value!.id;
  const paymentCategoryId = EntityId.create().value!.id;

  beforeEach(() => {
    sut = new PayCreditCardBillDomainService();
    validBill = createMockOpenBill();
    validAccount = createMockAccountWithBalance(100000, budgetId);
  });

  describe('createPaymentOperation', () => {
    it('should create payment operation successfully', () => {
      const amount = 50000;
      const paidBy = EntityId.create().value!.id;
      const paidAt = new Date();

      const result = sut.createPaymentOperation(
        validBill,
        validAccount,
        budgetId,
        amount,
        paidBy,
        paidAt,
        paymentCategoryId,
      );

      expect(result.hasError).toBe(false);
      expect(result.data!.debitTransaction).toBeDefined();
      expect(result.data!.billPaidEvent).toBeDefined();
      expect(result.data!.debitTransaction.amount).toBe(amount);
      expect(result.data!.billPaidEvent.amount).toBe(amount);
      expect(result.data!.billPaidEvent.paidAt).toBe(paidAt);
    });

    it('should fail when bill is deleted', () => {
      validBill.delete();

      const result = sut.createPaymentOperation(
        validBill,
        validAccount,
        budgetId,
        50000,
        EntityId.create().value!.id,
        new Date(),
        paymentCategoryId,
      );

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        CreditCardBillAlreadyDeletedError,
      );
    });

    it('should fail when account has insufficient balance', () => {
      validAccount = createMockSavingsAccountWithBalance(10000, budgetId);

      const result = sut.createPaymentOperation(
        validBill,
        validAccount,
        budgetId,
        50000,
        EntityId.create().value!.id,
        new Date(),
        paymentCategoryId,
      );

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InsufficientBalanceError);
    });

    it('should succeed when bill is already paid (idempotent)', () => {
      validBill.markAsPaid();

      const result = sut.createPaymentOperation(
        validBill,
        validAccount,
        budgetId,
        50000,
        EntityId.create().value!.id,
        new Date(),
        paymentCategoryId,
      );

      expect(result.hasError).toBe(false);
    });

    it('should create transaction with correct description', () => {
      const result = sut.createPaymentOperation(
        validBill,
        validAccount,
        budgetId,
        50000,
        EntityId.create().value!.id,
        new Date(),
        paymentCategoryId,
      );

      expect(result.hasError).toBe(false);
      expect(result.data!.debitTransaction.description).toContain(
        'Pagamento fatura cartão',
      );
      expect(result.data!.debitTransaction.description).toContain(validBill.id);
    });

    it('should use default date when not provided', () => {
      const beforeExecution = new Date();

      const result = sut.createPaymentOperation(
        validBill,
        validAccount,
        budgetId,
        50000,
        EntityId.create().value!.id,
        undefined,
        paymentCategoryId,
      );

      const afterExecution = new Date();
      expect(result.hasError).toBe(false);
      expect(
        result.data!.debitTransaction.transactionDate.getTime(),
      ).toBeGreaterThanOrEqual(beforeExecution.getTime());
      expect(
        result.data!.debitTransaction.transactionDate.getTime(),
      ).toBeLessThanOrEqual(afterExecution.getTime());
    });

    it('should fail with invalid category id', () => {
      const result = sut.createPaymentOperation(
        validBill,
        validAccount,
        budgetId,
        50000,
        EntityId.create().value!.id,
        new Date(),
        '',
      );

      expect(result.hasError).toBe(true);
    });

    it('should fail when account belongs to different budget', () => {
      const differentBudgetId = EntityId.create().value!.id;

      const result = sut.createPaymentOperation(
        validBill,
        validAccount,
        differentBudgetId,
        50000,
        EntityId.create().value!.id,
        new Date(),
        paymentCategoryId,
      );

      expect(result.hasError).toBe(true);
      expect(result.errors[0].message).toContain('Account not found');
    });
  });
});

function createMockOpenBill(): CreditCardBill {
  const restoreData = {
    id: EntityId.create().value!.id,
    creditCardId: EntityId.create().value!.id,
    closingDate: new Date('2025-01-10'),
    dueDate: new Date('2025-01-25'),
    amount: 50000,
    status: BillStatusEnum.OPEN,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return CreditCardBill.restore(restoreData).data!;
}

function createMockAccountWithBalance(
  balance: number,
  budgetId: string = EntityId.create().value!.id,
): Account {
  const restoreData = {
    id: EntityId.create().value!.id,
    name: 'Conta Corrente',
    type: AccountTypeEnum.CHECKING_ACCOUNT,
    budgetId,
    balance,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return Account.restore(restoreData).data!;
}

function createMockSavingsAccountWithBalance(
  balance: number,
  budgetId: string = EntityId.create().value!.id,
): Account {
  const restoreData = {
    id: EntityId.create().value!.id,
    name: 'Conta Poupança',
    type: AccountTypeEnum.SAVINGS_ACCOUNT,
    budgetId,
    balance,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return Account.restore(restoreData).data!;
}

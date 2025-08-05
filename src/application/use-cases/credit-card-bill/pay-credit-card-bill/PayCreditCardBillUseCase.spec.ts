import { PayCreditCardBillUseCase } from './PayCreditCardBillUseCase';
import { PayCreditCardBillDto } from './PayCreditCardBillDto';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { GetCreditCardBillRepositoryStub } from '../../../shared/tests/stubs/GetCreditCardBillRepositoryStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { IPayCreditCardBillUnitOfWorkStub } from '../../../shared/tests/stubs/IPayCreditCardBillUnitOfWorkStub';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { CreditCardBillNotFoundError } from '../../../shared/errors/CreditCardBillNotFoundError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { InsufficientBalanceError } from '@domain/aggregates/account/errors/InsufficientBalanceError';
import { NotFoundError } from '@domain/shared/errors/NotFoundError';

describe('PayCreditCardBillUseCase', () => {
  let useCase: PayCreditCardBillUseCase;
  let getCreditCardBillRepository: GetCreditCardBillRepositoryStub;
  let getAccountRepository: GetAccountRepositoryStub;
  let payUnitOfWork: IPayCreditCardBillUnitOfWorkStub;
  let budgetAuthorizationService: BudgetAuthorizationServiceStub;
  let eventPublisher: EventPublisherStub;

  const userId = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;
  const paymentCategoryId = EntityId.create().value!.id;

  beforeEach(() => {
    getCreditCardBillRepository = new GetCreditCardBillRepositoryStub();
    getAccountRepository = new GetAccountRepositoryStub();
    payUnitOfWork = new IPayCreditCardBillUnitOfWorkStub();
    budgetAuthorizationService = new BudgetAuthorizationServiceStub();
    eventPublisher = new EventPublisherStub();

    useCase = new PayCreditCardBillUseCase(
      getCreditCardBillRepository,
      getAccountRepository,
      payUnitOfWork,
      budgetAuthorizationService,
      eventPublisher,
    );
  });

  const createMockBill = (
    status: BillStatusEnum = BillStatusEnum.OPEN,
  ): CreditCardBill => {
    const restoreData = {
      id: EntityId.create().value!.id,
      creditCardId: EntityId.create().value!.id,
      closingDate: new Date('2025-01-10'),
      dueDate: new Date('2025-01-25'),
      amount: 50000,
      status,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return CreditCardBill.restore(restoreData).data!;
  };

  const createMockAccount = (
    balance: number = 100000,
    accountBudgetId: string = budgetId,
  ): Account => {
    const restoreData = {
      id: EntityId.create().value!.id,
      name: 'Conta Corrente',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId: accountBudgetId,
      balance,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return Account.restore(restoreData).data!;
  };

  const createValidDto = (
    overrides: Partial<PayCreditCardBillDto> = {},
  ): PayCreditCardBillDto => ({
    userId,
    budgetId,
    creditCardBillId: EntityId.create().value!.id,
    accountId: EntityId.create().value!.id,
    amount: 50000,
    paymentCategoryId,
    ...overrides,
  });

  describe('execute', () => {
    it('should pay credit card bill successfully', async () => {
      const bill = createMockBill();
      const account = createMockAccount();
      const dto = createValidDto({
        creditCardBillId: bill.id,
        accountId: account.id,
      });

      getCreditCardBillRepository.setCreditCardBill(bill);
      getAccountRepository.mockAccount = account;

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(bill.id);
      expect(payUnitOfWork.executedParams).toBeDefined();
      expect(payUnitOfWork.executedParams!.bill.id).toBe(bill.id);
      expect(eventPublisher.publishCalls).toHaveLength(1);
    });

    it('should fail when user has no permission', async () => {
      budgetAuthorizationService.mockHasAccess = false;
      const dto = createValidDto();

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
    });

    it('should fail when credit card bill not found', async () => {
      getCreditCardBillRepository.setCreditCardBill(null);
      const dto = createValidDto();

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CreditCardBillNotFoundError);
    });

    it('should fail when account not found', async () => {
      const bill = createMockBill();
      getCreditCardBillRepository.setCreditCardBill(bill);
      getAccountRepository.shouldReturnNull = true;

      const dto = createValidDto({
        creditCardBillId: bill.id,
      });

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountNotFoundError);
    });

    it('should fail when account belongs to different budget', async () => {
      const bill = createMockBill();
      const differentBudgetId = EntityId.create().value!.id;

      const accountResult = Account.restore({
        id: EntityId.create().value!.id,
        name: 'Test Account',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: differentBudgetId,
        balance: 100000,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (accountResult.hasError) {
        throw new Error(
          'Failed to create account for test: ' +
            accountResult.errors.map((e) => e.message).join(', '),
        );
      }

      const account = accountResult.data!;

      getCreditCardBillRepository.setCreditCardBill(bill);

      // Mock the repository to return the account for this specific test
      jest
        .spyOn(getAccountRepository, 'execute')
        .mockResolvedValueOnce(Either.success(account));

      const dto = createValidDto({
        creditCardBillId: bill.id,
        accountId: account.id,
      });

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(NotFoundError);
      expect(result.errors[0].message).toContain('Account not found');
    });

    it('should fail when account has insufficient balance', async () => {
      const bill = createMockBill();
      const savingsAccount = Account.restore({
        id: EntityId.create().value!.id,
        name: 'Conta Poupança',
        type: AccountTypeEnum.SAVINGS_ACCOUNT,
        budgetId,
        balance: 10000, // Insufficient balance
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).data!;

      getCreditCardBillRepository.setCreditCardBill(bill);
      getAccountRepository.mockAccount = savingsAccount;

      const dto = createValidDto({
        creditCardBillId: bill.id,
        accountId: savingsAccount.id,
        amount: 50000, // More than account balance
      });

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InsufficientBalanceError);
    });

    it('should succeed when bill is already paid (idempotent)', async () => {
      const bill = createMockBill(BillStatusEnum.PAID);
      const account = createMockAccount();

      getCreditCardBillRepository.setCreditCardBill(bill);
      getAccountRepository.mockAccount = account;

      const dto = createValidDto({
        creditCardBillId: bill.id,
        accountId: account.id,
      });

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(bill.id);
    });

    it('should use provided payment date', async () => {
      const bill = createMockBill();
      const account = createMockAccount();
      const paidAt = new Date('2025-01-15');

      getCreditCardBillRepository.setCreditCardBill(bill);
      getAccountRepository.mockAccount = account;

      const dto = createValidDto({
        creditCardBillId: bill.id,
        accountId: account.id,
        paidAt,
      });

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(false);
    });

    it('should handle event publishing failure gracefully', async () => {
      const bill = createMockBill();
      const account = createMockAccount();

      getCreditCardBillRepository.setCreditCardBill(bill);
      getAccountRepository.mockAccount = account;

      // Mock event publisher to throw error
      jest
        .spyOn(eventPublisher, 'publish')
        .mockRejectedValueOnce(new Error('Event publishing failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const dto = createValidDto({
        creditCardBillId: bill.id,
        accountId: account.id,
      });

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to publish domain event:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});

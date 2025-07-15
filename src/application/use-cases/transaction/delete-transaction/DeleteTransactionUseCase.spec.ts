import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionNotFoundError } from '../../../shared/errors/TransactionNotFoundError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { DeleteTransactionRepositoryStub } from '../../../shared/tests/stubs/DeleteTransactionRepositoryStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetTransactionRepositoryStub } from '../../../shared/tests/stubs/GetTransactionRepositoryStub';
import { DeleteTransactionDto } from './DeleteTransactionDto';
import { DeleteTransactionUseCase } from './DeleteTransactionUseCase';

describe('DeleteTransactionUseCase', () => {
  let useCase: DeleteTransactionUseCase;
  let getTransactionRepositoryStub: GetTransactionRepositoryStub;
  let deleteTransactionRepositoryStub: DeleteTransactionRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;
  let mockTransaction: Transaction;

  beforeEach(() => {
    getTransactionRepositoryStub = new GetTransactionRepositoryStub();
    deleteTransactionRepositoryStub = new DeleteTransactionRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();

    const transactionResult = Transaction.create({
      description: 'Test Transaction',
      amount: 100,
      type: TransactionTypeEnum.EXPENSE,
      transactionDate: new Date(),
      categoryId: EntityId.create().value!.id,
      budgetId: EntityId.create().value!.id,
      accountId: EntityId.create().value!.id,
      status: TransactionStatusEnum.SCHEDULED,
    });

    if (transactionResult.hasError) {
      throw new Error(
        `Failed to create transaction: ${transactionResult.errors.map((e) => e.message).join(', ')}`,
      );
    }

    mockTransaction = transactionResult.data!;
    mockTransaction.clearEvents();
    getTransactionRepositoryStub.mockTransaction = mockTransaction;
    budgetAuthorizationServiceStub.mockHasAccess = true;

    useCase = new DeleteTransactionUseCase(
      getTransactionRepositoryStub,
      deleteTransactionRepositoryStub,
      budgetAuthorizationServiceStub,
      eventPublisherStub,
    );
  });

  describe('execute', () => {
    it('should delete transaction successfully when user has permission', async () => {
      const dto: DeleteTransactionDto = {
        id: mockTransaction.id,
        userId: 'authorized-user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.data).toEqual({ id: mockTransaction.id });
      expect(deleteTransactionRepositoryStub.executeCalls).toContain(
        mockTransaction.id,
      );
      expect(eventPublisherStub.publishManyCalls).toHaveLength(1);
    });

    it('should return error when user has no permission', async () => {
      budgetAuthorizationServiceStub.mockHasAccess = false;

      const dto: DeleteTransactionDto = {
        id: mockTransaction.id,
        userId: 'unauthorized-user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
      expect(deleteTransactionRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when transaction not found', async () => {
      getTransactionRepositoryStub.shouldReturnNull = true;

      const dto: DeleteTransactionDto = {
        id: 'non-existent-id',
        userId: 'user-id',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionNotFoundError);
    });

    it('should return error when get transaction repository fails', async () => {
      getTransactionRepositoryStub.shouldFail = true;

      const dto: DeleteTransactionDto = {
        id: mockTransaction.id,
        userId: 'user-id',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionNotFoundError);
    });

    it('should return error when delete transaction repository fails', async () => {
      deleteTransactionRepositoryStub.shouldFail = true;

      const dto: DeleteTransactionDto = {
        id: mockTransaction.id,
        userId: 'authorized-user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        TransactionPersistenceFailedError,
      );
    });

    it('should return error when authorization service fails', async () => {
      budgetAuthorizationServiceStub.shouldFail = true;

      const dto: DeleteTransactionDto = {
        id: mockTransaction.id,
        userId: 'user-id',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
    });

    it('should call authorization service with correct parameters', async () => {
      const dto: DeleteTransactionDto = {
        id: mockTransaction.id,
        userId: 'test-user',
      };

      await useCase.execute(dto);

      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls).toHaveLength(
        1,
      );
      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls[0]).toEqual({
        userId: 'test-user',
        budgetId: mockTransaction.budgetId,
      });
    });

    it('should publish events after successful deletion', async () => {
      const dto: DeleteTransactionDto = {
        id: mockTransaction.id,
        userId: 'authorized-user',
      };

      await useCase.execute(dto);

      expect(eventPublisherStub.publishManyCalls).toHaveLength(1);
      expect(eventPublisherStub.publishManyCalls[0]).toHaveLength(1);
    });

    it('should return error when transaction is already deleted', async () => {
      mockTransaction.delete();

      const dto: DeleteTransactionDto = {
        id: mockTransaction.id,
        userId: 'authorized-user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
    });
  });
});

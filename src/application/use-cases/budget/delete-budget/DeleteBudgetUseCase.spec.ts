import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { BudgetDeletedEvent } from '@domain/aggregates/budget/events/BudgetDeletedEvent';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { BudgetNotFoundError } from '../../../shared/errors/BudgetNotFoundError';
import { BudgetRepositoryError } from '../../../shared/errors/BudgetRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { CannotDeleteBudgetWithAccountsError } from '../../../shared/errors/CannotDeleteBudgetWithAccountsError';
import { CannotDeleteBudgetWithTransactionsError } from '../../../shared/errors/CannotDeleteBudgetWithTransactionsError';
import { OnlyOwnerCanDeleteBudgetError } from '../../../shared/errors/OnlyOwnerCanDeleteBudgetError';
import { BudgetDeletionFailedError } from '../../../shared/errors/BudgetDeletionFailedError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { DeleteBudgetRepositoryStub } from '../../../shared/tests/stubs/DeleteBudgetRepositoryStub';
import { CheckBudgetDependenciesRepositoryStub } from '../../../shared/tests/stubs/CheckBudgetDependenciesRepositoryStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetBudgetRepositoryStub } from '../../../shared/tests/stubs/GetBudgetRepositoryStub';
import { DeleteBudgetDto } from './DeleteBudgetDto';
import { DeleteBudgetUseCase } from './DeleteBudgetUseCase';

describe('DeleteBudgetUseCase', () => {
  let useCase: DeleteBudgetUseCase;
  let getBudgetRepositoryStub: GetBudgetRepositoryStub;
  let deleteBudgetRepositoryStub: DeleteBudgetRepositoryStub;
  let checkDependenciesRepositoryStub: CheckBudgetDependenciesRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;
  let mockBudget: Budget;
  let ownerId: string;

  beforeEach(() => {
    getBudgetRepositoryStub = new GetBudgetRepositoryStub();
    deleteBudgetRepositoryStub = new DeleteBudgetRepositoryStub();
    checkDependenciesRepositoryStub =
      new CheckBudgetDependenciesRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();

    ownerId = EntityId.create().value!.id;
    const budgetResult = Budget.create({
      name: 'Test Budget',
      ownerId,
      participantIds: [],
    });

    if (budgetResult.hasError) {
      throw new Error(
        `Failed to create budget: ${budgetResult.errors.map((e) => e.message).join(', ')}`,
      );
    }

    mockBudget = budgetResult.data!;
    mockBudget.clearEvents();
    getBudgetRepositoryStub.mockBudget = mockBudget;
    budgetAuthorizationServiceStub.mockHasAccess = true;

    useCase = new DeleteBudgetUseCase(
      getBudgetRepositoryStub,
      deleteBudgetRepositoryStub,
      checkDependenciesRepositoryStub,
      budgetAuthorizationServiceStub,
      eventPublisherStub,
    );
  });

  describe('execute', () => {
    it('should delete budget successfully', async () => {
      const dto: DeleteBudgetDto = { userId: ownerId, budgetId: mockBudget.id };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.data).toEqual({ id: mockBudget.id });
      expect(deleteBudgetRepositoryStub.executeCalls).toContain(mockBudget.id);
      expect(eventPublisherStub.publishManyCalls).toHaveLength(1);
      const event = eventPublisherStub
        .publishManyCalls[0][0] as BudgetDeletedEvent;
      expect(event.aggregateId).toBe(mockBudget.id);
    });

    it('should return error when user is not owner', async () => {
      const dto: DeleteBudgetDto = {
        userId: EntityId.create().value!.id,
        budgetId: mockBudget.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(OnlyOwnerCanDeleteBudgetError);
      expect(deleteBudgetRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when budget has accounts', async () => {
      checkDependenciesRepositoryStub.hasAccountsResult = true;

      const dto: DeleteBudgetDto = { userId: ownerId, budgetId: mockBudget.id };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        CannotDeleteBudgetWithAccountsError,
      );
    });

    it('should return error when budget has transactions', async () => {
      checkDependenciesRepositoryStub.hasTransactionsResult = true;

      const dto: DeleteBudgetDto = { userId: ownerId, budgetId: mockBudget.id };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        CannotDeleteBudgetWithTransactionsError,
      );
    });

    it('should return error when budget not found', async () => {
      getBudgetRepositoryStub.shouldReturnNull = true;

      const dto: DeleteBudgetDto = {
        userId: ownerId,
        budgetId: 'non-existent',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetNotFoundError);
    });

    it('should return error when user has no permission', async () => {
      budgetAuthorizationServiceStub.mockHasAccess = false;

      const dto: DeleteBudgetDto = { userId: ownerId, budgetId: mockBudget.id };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
    });

    it('should return error when getBudget repository fails', async () => {
      getBudgetRepositoryStub.shouldFail = true;

      const dto: DeleteBudgetDto = { userId: ownerId, budgetId: mockBudget.id };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetRepositoryError);
    });

    it('should return error when deleteBudget repository fails', async () => {
      deleteBudgetRepositoryStub.shouldFail = true;

      const dto: DeleteBudgetDto = { userId: ownerId, budgetId: mockBudget.id };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetDeletionFailedError);
    });

    it('should return error when dependency check fails', async () => {
      checkDependenciesRepositoryStub.shouldFail = true;

      const dto: DeleteBudgetDto = { userId: ownerId, budgetId: mockBudget.id };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetDeletionFailedError);
    });

    it('should call services with correct parameters', async () => {
      const dto: DeleteBudgetDto = { userId: ownerId, budgetId: mockBudget.id };

      await useCase.execute(dto);

      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls).toHaveLength(
        1,
      );
      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls[0]).toEqual({
        userId: ownerId,
        budgetId: mockBudget.id,
      });
      expect(getBudgetRepositoryStub.executeCalls).toHaveLength(1);
      expect(getBudgetRepositoryStub.executeCalls[0]).toBe(mockBudget.id);
      expect(deleteBudgetRepositoryStub.executeCalls).toHaveLength(1);
      expect(deleteBudgetRepositoryStub.executeCalls[0]).toBe(mockBudget.id);
    });

    it('should handle event publishing errors gracefully', async () => {
      jest
        .spyOn(eventPublisherStub, 'publishMany')
        .mockRejectedValueOnce(new Error('fail'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const dto: DeleteBudgetDto = { userId: ownerId, budgetId: mockBudget.id };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});

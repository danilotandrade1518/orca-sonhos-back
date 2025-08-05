import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { BudgetNotFoundError } from '../../../shared/errors/BudgetNotFoundError';
import { BudgetPersistenceFailedError } from '../../../shared/errors/BudgetPersistenceFailedError';
import { BudgetRepositoryError } from '../../../shared/errors/BudgetRepositoryError';
import { BudgetUpdateFailedError } from '../../../shared/errors/BudgetUpdateFailedError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetBudgetRepositoryStub } from '../../../shared/tests/stubs/GetBudgetRepositoryStub';
import { SaveBudgetRepositoryStub } from '../../../shared/tests/stubs/SaveBudgetRepositoryStub';
import { UpdateBudgetDto } from './UpdateBudgetDto';
import { UpdateBudgetUseCase } from './UpdateBudgetUseCase';

describe('UpdateBudgetUseCase', () => {
  let useCase: UpdateBudgetUseCase;
  let getBudgetRepositoryStub: GetBudgetRepositoryStub;
  let saveBudgetRepositoryStub: SaveBudgetRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let validBudget: Budget;
  const userId = EntityId.create().value!.id;

  beforeEach(() => {
    getBudgetRepositoryStub = new GetBudgetRepositoryStub();
    saveBudgetRepositoryStub = new SaveBudgetRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    useCase = new UpdateBudgetUseCase(
      getBudgetRepositoryStub,
      saveBudgetRepositoryStub,
      budgetAuthorizationServiceStub,
    );

    const budgetResult = Budget.create({
      name: 'Test Budget',
      ownerId: userId,
      participantIds: [],
    });

    if (budgetResult.hasError) {
      throw new Error(
        `Failed to create budget: ${budgetResult.errors.map((e) => e.message).join(', ')}`,
      );
    }

    validBudget = budgetResult.data!;
    getBudgetRepositoryStub.mockBudget = validBudget;
    budgetAuthorizationServiceStub.mockHasAccess = true;
  });

  describe('execute', () => {
    it('should update budget name successfully', async () => {
      const dto: UpdateBudgetDto = {
        userId,
        budgetId: validBudget.id,
        name: 'Updated Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(validBudget.id);
    });

    it('should succeed with optional data', async () => {
      const dto: UpdateBudgetDto = {
        userId,
        budgetId: validBudget.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.data!.id).toBe(validBudget.id);
    });

    it('should return error when user has no permission', async () => {
      budgetAuthorizationServiceStub.mockHasAccess = false;

      const dto: UpdateBudgetDto = {
        userId: 'unauthorized',
        budgetId: validBudget.id,
        name: 'New Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
      expect(saveBudgetRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when budget not found', async () => {
      getBudgetRepositoryStub.shouldReturnNull = true;

      const dto: UpdateBudgetDto = {
        userId,
        budgetId: 'non-existent',
        name: 'New Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetNotFoundError);
    });

    it('should return error when name is invalid', async () => {
      const dto: UpdateBudgetDto = {
        userId,
        budgetId: validBudget.id,
        name: '',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetUpdateFailedError);
      expect(saveBudgetRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when getBudget repository fails', async () => {
      getBudgetRepositoryStub.shouldFail = true;

      const dto: UpdateBudgetDto = {
        userId,
        budgetId: validBudget.id,
        name: 'New Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetRepositoryError);
      expect(saveBudgetRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when saveBudget repository fails', async () => {
      saveBudgetRepositoryStub.shouldFail = true;

      const dto: UpdateBudgetDto = {
        userId,
        budgetId: validBudget.id,
        name: 'New Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetPersistenceFailedError);
    });

    it('should return error when authorization service fails', async () => {
      budgetAuthorizationServiceStub.shouldFail = true;

      const dto: UpdateBudgetDto = {
        userId,
        budgetId: validBudget.id,
        name: 'New Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(saveBudgetRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should call services with correct parameters', async () => {
      const dto: UpdateBudgetDto = {
        userId: 'test-user',
        budgetId: validBudget.id,
        name: 'New Name',
      };

      await useCase.execute(dto);

      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls).toHaveLength(
        1,
      );
      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls[0]).toEqual({
        userId: 'test-user',
        budgetId: validBudget.id,
      });
      expect(getBudgetRepositoryStub.executeCalls).toHaveLength(1);
      expect(getBudgetRepositoryStub.executeCalls[0]).toBe(validBudget.id);
      expect(saveBudgetRepositoryStub.executeCalls).toHaveLength(1);
      expect(saveBudgetRepositoryStub.executeCalls[0].id).toBe(validBudget.id);
    });
  });
});

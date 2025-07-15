import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { BudgetNotFoundError } from '../../shared/errors/BudgetNotFoundError';
import { BudgetRepositoryError } from '../../shared/errors/BudgetRepositoryError';
import { GetBudgetRepositoryStub } from '../../shared/tests/stubs/GetBudgetRepositoryStub';
import { BudgetAuthorizationService } from './BudgetAuthorizationService';

describe('BudgetAuthorizationService', () => {
  let service: BudgetAuthorizationService;
  let getBudgetRepositoryStub: GetBudgetRepositoryStub;
  let mockBudget: Budget;
  let ownerId: string;
  let participantId: string;

  beforeEach(() => {
    getBudgetRepositoryStub = new GetBudgetRepositoryStub();
    service = new BudgetAuthorizationService(getBudgetRepositoryStub);

    ownerId = EntityId.create().value!.id;
    participantId = EntityId.create().value!.id;

    const budgetResult = Budget.create({
      name: 'Test Budget',
      ownerId,
      participantIds: [participantId],
    });

    if (budgetResult.hasError) {
      throw new Error(
        `Failed to create budget: ${budgetResult.errors.map((e) => e.message).join(', ')}`,
      );
    }

    mockBudget = budgetResult.data!;
    getBudgetRepositoryStub.mockBudget = mockBudget;
  });

  describe('canAccessBudget', () => {
    it('should return true when user is budget owner', async () => {
      const result = await service.canAccessBudget(ownerId, mockBudget.id);

      expect(result.hasData).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return true when user is participant', async () => {
      const result = await service.canAccessBudget(
        participantId,
        mockBudget.id,
      );

      expect(result.hasData).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when user has no access', async () => {
      const otherUserId = EntityId.create().value!.id;

      const result = await service.canAccessBudget(otherUserId, mockBudget.id);

      expect(result.data).toBe(false);
    });

    it('should return error when budget not found', async () => {
      getBudgetRepositoryStub.shouldReturnNull = true;

      const result = await service.canAccessBudget(
        'user-id',
        'non-existent-id',
      );

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetNotFoundError);
    });

    it('should return error when repository fails', async () => {
      getBudgetRepositoryStub.shouldFail = true;

      const result = await service.canAccessBudget('user-id', mockBudget.id);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetRepositoryError);
    });

    it('should call repository with correct budget id', async () => {
      await service.canAccessBudget('user-id', mockBudget.id);

      expect(getBudgetRepositoryStub.executeCalls).toContain(mockBudget.id);
    });
  });
});

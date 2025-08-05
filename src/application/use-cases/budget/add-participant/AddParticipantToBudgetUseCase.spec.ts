import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { BudgetNotFoundError } from '../../../shared/errors/BudgetNotFoundError';
import { BudgetPersistenceFailedError } from '../../../shared/errors/BudgetPersistenceFailedError';
import { BudgetRepositoryError } from '../../../shared/errors/BudgetRepositoryError';
import { BudgetUpdateFailedError } from '../../../shared/errors/BudgetUpdateFailedError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetBudgetRepositoryStub } from '../../../shared/tests/stubs/GetBudgetRepositoryStub';
import { SaveBudgetRepositoryStub } from '../../../shared/tests/stubs/SaveBudgetRepositoryStub';
import { AddParticipantToBudgetDto } from './AddParticipantToBudgetDto';
import { AddParticipantToBudgetUseCase } from './AddParticipantToBudgetUseCase';

describe('AddParticipantToBudgetUseCase', () => {
  let useCase: AddParticipantToBudgetUseCase;
  let getBudgetRepositoryStub: GetBudgetRepositoryStub;
  let saveBudgetRepositoryStub: SaveBudgetRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let validBudget: Budget;
  const userId = EntityId.create().value!.id;
  const newParticipantId = EntityId.create().value!.id;

  beforeEach(() => {
    getBudgetRepositoryStub = new GetBudgetRepositoryStub();
    saveBudgetRepositoryStub = new SaveBudgetRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    useCase = new AddParticipantToBudgetUseCase(
      getBudgetRepositoryStub,
      saveBudgetRepositoryStub,
      budgetAuthorizationServiceStub,
    );

    const budgetResult = Budget.create({
      name: 'Test Budget',
      ownerId: userId,
      participantIds: [],
      type: BudgetTypeEnum.SHARED,
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
    it('should add participant successfully when user has permission', async () => {
      const dto: AddParticipantToBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId: newParticipantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(validBudget.id);
    });

    it('should fail when user has no permission', async () => {
      budgetAuthorizationServiceStub.mockHasAccess = false;

      const dto: AddParticipantToBudgetDto = {
        userId: 'unauthorized-user',
        budgetId: validBudget.id,
        participantId: newParticipantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new InsufficientPermissionsError());
    });

    it('should fail when budget does not exist', async () => {
      getBudgetRepositoryStub.shouldReturnNull = true;

      const dto: AddParticipantToBudgetDto = {
        userId,
        budgetId: 'non-existent-id',
        participantId: newParticipantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new BudgetNotFoundError());
    });

    it('should fail when participantId is invalid', async () => {
      const dto: AddParticipantToBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId: 'invalid-id',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toBeInstanceOf(BudgetUpdateFailedError);
    });

    it('should fail when getBudget repository returns error', async () => {
      getBudgetRepositoryStub.shouldFail = true;

      const dto: AddParticipantToBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId: newParticipantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new BudgetRepositoryError());
    });

    it('should fail when saveBudget repository returns error', async () => {
      saveBudgetRepositoryStub.shouldFail = true;

      const dto: AddParticipantToBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId: newParticipantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new BudgetPersistenceFailedError());
    });

    it('should fail when authorization service returns error', async () => {
      const repositoryError = new RepositoryError(
        'Authorization service failed',
      );
      jest
        .spyOn(budgetAuthorizationServiceStub, 'canAccessBudget')
        .mockResolvedValueOnce(Either.errors([repositoryError]));

      const dto: AddParticipantToBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId: newParticipantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
    });

    it('should call authorization service with correct parameters', async () => {
      const dto: AddParticipantToBudgetDto = {
        userId: 'test-user',
        budgetId: validBudget.id,
        participantId: newParticipantId,
      };

      await useCase.execute(dto);

      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls).toHaveLength(
        1,
      );
      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls[0]).toEqual({
        userId: 'test-user',
        budgetId: validBudget.id,
      });
    });
  });
});

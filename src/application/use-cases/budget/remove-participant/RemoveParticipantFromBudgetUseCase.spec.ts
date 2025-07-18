import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { CannotRemoveOwnerFromParticipantsError } from '@domain/shared/errors/CannotRemoveOwnerFromParticipantsError';
import { BudgetNotFoundError } from '../../../shared/errors/BudgetNotFoundError';
import { BudgetPersistenceFailedError } from '../../../shared/errors/BudgetPersistenceFailedError';
import { BudgetRepositoryError } from '../../../shared/errors/BudgetRepositoryError';
import { BudgetUpdateFailedError } from '../../../shared/errors/BudgetUpdateFailedError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetBudgetRepositoryStub } from '../../../shared/tests/stubs/GetBudgetRepositoryStub';
import { SaveBudgetRepositoryStub } from '../../../shared/tests/stubs/SaveBudgetRepositoryStub';
import { RemoveParticipantFromBudgetDto } from './RemoveParticipantFromBudgetDto';
import { RemoveParticipantFromBudgetUseCase } from './RemoveParticipantFromBudgetUseCase';

describe('RemoveParticipantFromBudgetUseCase', () => {
  let useCase: RemoveParticipantFromBudgetUseCase;
  let getBudgetRepositoryStub: GetBudgetRepositoryStub;
  let saveBudgetRepositoryStub: SaveBudgetRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;
  let validBudget: Budget;
  const userId = EntityId.create().value!.id;
  const participantId = EntityId.create().value!.id;

  beforeEach(() => {
    getBudgetRepositoryStub = new GetBudgetRepositoryStub();
    saveBudgetRepositoryStub = new SaveBudgetRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();
    useCase = new RemoveParticipantFromBudgetUseCase(
      getBudgetRepositoryStub,
      saveBudgetRepositoryStub,
      budgetAuthorizationServiceStub,
      eventPublisherStub,
    );

    const budgetResult = Budget.create({
      name: 'Test Budget',
      ownerId: userId,
      participantIds: [participantId],
    });

    if (budgetResult.hasError) {
      throw new Error(
        `Failed to create budget: ${budgetResult.errors.map((e) => e.message).join(', ')}`,
      );
    }

    validBudget = budgetResult.data!;
    validBudget.clearEvents();
    getBudgetRepositoryStub.mockBudget = validBudget;
    budgetAuthorizationServiceStub.mockHasAccess = true;
  });

  describe('execute', () => {
    it('should remove participant successfully when user has permission', async () => {
      const dto: RemoveParticipantFromBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(validBudget.id);
    });

    it('should fail when user has no permission', async () => {
      budgetAuthorizationServiceStub.mockHasAccess = false;

      const dto: RemoveParticipantFromBudgetDto = {
        userId: 'unauthorized-user',
        budgetId: validBudget.id,
        participantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new InsufficientPermissionsError());
    });

    it('should fail when budget does not exist', async () => {
      getBudgetRepositoryStub.shouldReturnNull = true;

      const dto: RemoveParticipantFromBudgetDto = {
        userId,
        budgetId: 'non-existent-id',
        participantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new BudgetNotFoundError());
    });

    it('should fail when removing owner', async () => {
      const dto: RemoveParticipantFromBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId: userId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toBeInstanceOf(BudgetUpdateFailedError);
      expect(result.errors[0]).toEqual(
        new BudgetUpdateFailedError(
          new CannotRemoveOwnerFromParticipantsError().message,
        ),
      );
    });

    it('should fail when participantId is invalid', async () => {
      const dto: RemoveParticipantFromBudgetDto = {
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

      const dto: RemoveParticipantFromBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new BudgetRepositoryError());
    });

    it('should fail when saveBudget repository returns error', async () => {
      saveBudgetRepositoryStub.shouldFail = true;

      const dto: RemoveParticipantFromBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId,
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

      const dto: RemoveParticipantFromBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
    });

    it('should call authorization service with correct parameters', async () => {
      const dto: RemoveParticipantFromBudgetDto = {
        userId: 'test-user',
        budgetId: validBudget.id,
        participantId,
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

    it('should publish events after successful removal', async () => {
      const dto: RemoveParticipantFromBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      const events = validBudget.getEvents();
      if (events.length > 0) {
        expect(eventPublisherStub.publishManyCalls).toHaveLength(1);
        expect(eventPublisherStub.publishManyCalls[0]).toHaveLength(
          events.length,
        );
      } else {
        expect(eventPublisherStub.publishManyCalls).toHaveLength(0);
      }
    });

    it('should handle event publishing errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest
        .spyOn(eventPublisherStub, 'publishMany')
        .mockRejectedValueOnce(new Error('Event publishing failed'));

      const dto: RemoveParticipantFromBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should clear events after successful publishing', async () => {
      const clearEventsSpy = jest.spyOn(validBudget, 'clearEvents');

      const dto: RemoveParticipantFromBudgetDto = {
        userId,
        budgetId: validBudget.id,
        participantId,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      const events = validBudget.getEvents();
      if (events.length > 0) {
        expect(clearEventsSpy).toHaveBeenCalledTimes(1);
      }
    });
  });
});

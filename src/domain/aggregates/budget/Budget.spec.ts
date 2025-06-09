import { EntityId } from '../../shared/value-objects/entity-id/EntityId';
import { CannotRemoveOwnerFromParticipantsError } from './../../shared/errors/CannotRemoveOwnerFromParticipantsError';
import { InvalidEntityIdError } from './../../shared/errors/InvalidEntityIdError';
import { NotFoundError } from './../../shared/errors/NotFoundError';
import { Budget, CreateBudgetDTO } from './Budget';

describe('Budget (Orçamento)', () => {
  describe('create', () => {
    it('should create a budget successfully', () => {
      const data: CreateBudgetDTO = {
        name: 'Test Budget',
        ownerId: EntityId.create().value!.id,
      };

      const result = Budget.create(data);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe(data.name);
      expect(result.data!.ownerId).toBe(data.ownerId);
      expect(result.data!.participantIds).toContain(data.ownerId);
    });

    it('should return error when name is invalid', () => {
      const data: CreateBudgetDTO = {
        name: '',
        ownerId: EntityId.create().value!.id,
      };

      const result = Budget.create(data);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('InvalidEntityNameError');
    });

    it('should return error when owner id is invalid', () => {
      const data: CreateBudgetDTO = {
        name: 'Test Budget',
        ownerId: 'invalid-id',
      };

      const result = Budget.create(data);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('InvalidEntityIdError');
    });

    it('should return error when participant id is invalid', () => {
      const data: CreateBudgetDTO = {
        name: 'Test Budget',
        ownerId: EntityId.create().value!.id,
        participantIds: ['invalid-id'],
      };

      const result = Budget.create(data);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('InvalidEntityIdError');
    });
  });

  describe('addParticipant', () => {
    let budget: Budget;
    let ownerId: string;
    let participantId: string;

    beforeEach(() => {
      ownerId = EntityId.create().value!.id;
      participantId = EntityId.create().value!.id;

      const either = Budget.create({
        name: 'Test Budget',
        ownerId,
      });

      if (either.hasError) {
        throw new Error('Failed to create budget for testing');
      }

      budget = either.data!;
    });

    it('should add a participant successfully', () => {
      const result = budget.addParticipant(participantId);

      expect(result.hasError).toBe(false);
      expect(budget.participantIds).toContain(participantId);
      expect(budget.participantIds).toContain(ownerId);
    });

    it('should not add the same participant twice', () => {
      // Primeira adição
      const firstResult = budget.addParticipant(participantId);
      expect(firstResult.hasError).toBe(false);

      // Segunda adição do mesmo participante
      const secondResult = budget.addParticipant(participantId);
      expect(secondResult.hasError).toBe(false);

      // Verifica se o participante aparece apenas uma vez
      const participantCount = budget.participantIds.filter(
        (id) => id === participantId,
      ).length;
      expect(participantCount).toBe(1);
    });

    it('should return error when participant id is invalid', () => {
      const invalidId = 'invalid-id-format';
      const result = budget.addParticipant(invalidId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityIdError);
    });

    it('should update the updatedAt timestamp after adding participant', () => {
      const oldUpdatedAt = budget.updatedAt;

      setTimeout(() => {
        const result = budget.addParticipant(participantId);

        expect(result.hasError).toBe(false);
        expect(budget.updatedAt.getTime()).toBeGreaterThan(
          oldUpdatedAt.getTime(),
        );
      }, 1);
    });
  });

  describe('removeParticipant', () => {
    let budget: Budget;
    let ownerId: string;
    let participantId: string;

    beforeEach(() => {
      ownerId = EntityId.create().value!.id;
      participantId = EntityId.create().value!.id;

      const either = Budget.create({
        name: 'Test Budget',
        ownerId,
        participantIds: [participantId],
      });

      if (either.hasError) {
        throw new Error('Failed to create budget for testing');
      }

      budget = either.data!;
    });

    it('should remove a participant successfully', () => {
      const result = budget.removeParticipant(participantId);

      expect(result.hasError).toBe(false);
      expect(budget.participantIds).not.toContain(participantId);
      expect(budget.participantIds).toContain(ownerId);
    });

    it('should not allow removing the owner', () => {
      const result = budget.removeParticipant(ownerId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        CannotRemoveOwnerFromParticipantsError,
      );
      expect(budget.participantIds).toContain(ownerId);
    });

    it('should return error when participant does not exist', () => {
      const nonExistentId = EntityId.create().value!.id;
      const result = budget.removeParticipant(nonExistentId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(NotFoundError);
      expect(result.errors[0].message).toBe('participantId not found');
    });

    it('should return error when participant id is invalid', () => {
      const invalidId = 'invalid-id-format';
      const result = budget.removeParticipant(invalidId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityIdError);
    });

    it('should update the updatedAt timestamp after removing participant', () => {
      const oldUpdatedAt = budget.updatedAt;

      setTimeout(() => {
        const result = budget.removeParticipant(participantId);

        expect(result.hasError).toBe(false);
        expect(budget.updatedAt.getTime()).toBeGreaterThan(
          oldUpdatedAt.getTime(),
        );
      }, 1);
    });
  });
});

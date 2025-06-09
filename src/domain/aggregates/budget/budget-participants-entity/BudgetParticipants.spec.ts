import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { BudgetParticipants } from './BudgetParticipants';

describe('BudgetParticipants', () => {
  describe('create', () => {
    it('should create a BudgetParticipants instance successfully', () => {
      const participantId = EntityId.create().value!.id;
      const result = BudgetParticipants.create({
        participantIds: [participantId],
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.participants).toContain(participantId);
      expect(result.data!.participantCount).toBe(1);
      expect(result.data!.id).toBeDefined();
      expect(result.data!.id).not.toBe('');
    });

    it('should create a BudgetParticipants instance with multiple participants', () => {
      const participantId1 = EntityId.create().value!.id;
      const participantId2 = EntityId.create().value!.id;

      const result = BudgetParticipants.create({
        participantIds: [participantId1, participantId2],
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.participants).toContain(participantId1);
      expect(result.data!.participants).toContain(participantId2);
      expect(result.data!.participantCount).toBe(2);
      expect(result.data!.id).toBeDefined();
      expect(result.data!.id).not.toBe('');
    });

    it('should return error when participant id is invalid', () => {
      const result = BudgetParticipants.create({
        participantIds: ['invalid-id'],
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('InvalidEntityIdError');
    });
  });

  describe('addParticipant', () => {
    let budgetParticipants: BudgetParticipants;
    let participantId: string;

    beforeEach(() => {
      participantId = EntityId.create().value!.id;

      const result = BudgetParticipants.create({ participantIds: [] });
      if (result.hasError) {
        throw new Error('Failed to create BudgetParticipants for testing');
      }

      budgetParticipants = result.data!;
    });

    it('should add a participant successfully', () => {
      const result = budgetParticipants.addParticipant(participantId);

      expect(result.hasError).toBe(false);
      expect(budgetParticipants.participants).toContain(participantId);
      expect(budgetParticipants.participantCount).toBe(1);
    });

    it('should not add the same participant twice', () => {
      // Primeira adição
      const firstResult = budgetParticipants.addParticipant(participantId);
      expect(firstResult.hasError).toBe(false);

      // Segunda adição do mesmo participante
      const secondResult = budgetParticipants.addParticipant(participantId);
      expect(secondResult.hasError).toBe(false);

      // Verifica se o participante aparece apenas uma vez
      const participantCount = budgetParticipants.participants.filter(
        (id) => id === participantId,
      ).length;
      expect(participantCount).toBe(1);
    });

    it('should return error when participant id is invalid', () => {
      const result = budgetParticipants.addParticipant('invalid-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('InvalidEntityIdError');
    });
  });

  describe('removeParticipant', () => {
    let budgetParticipants: BudgetParticipants;
    let participantId: string;

    beforeEach(() => {
      participantId = EntityId.create().value!.id;

      const result = BudgetParticipants.create({
        participantIds: [participantId],
      });

      if (result.hasError) {
        throw new Error('Failed to create BudgetParticipants for testing');
      }

      budgetParticipants = result.data!;
    });

    it('should remove a participant successfully', () => {
      const result = budgetParticipants.removeParticipant(participantId);

      expect(result.hasError).toBe(false);
      expect(budgetParticipants.participants).not.toContain(participantId);
      expect(budgetParticipants.participantCount).toBe(0);
    });

    it('should return error when participant does not exist', () => {
      const nonExistentId = EntityId.create().value!.id;
      const result = budgetParticipants.removeParticipant(nonExistentId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('NotFoundError');
    });
  });
});

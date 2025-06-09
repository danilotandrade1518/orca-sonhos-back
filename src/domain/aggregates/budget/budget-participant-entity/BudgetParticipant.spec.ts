import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { BudgetParticipant, ParticipantRole } from './BudgetParticipant';

describe('BudgetParticipant', () => {
  describe('create', () => {
    it('should create a participant successfully', () => {
      const id = EntityId.create().value!.id;
      const result = BudgetParticipant.create({ id });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(id);
      expect(result.data!.role).toBe(ParticipantRole.PARTICIPANT);
      expect(result.data!.isOwner()).toBe(false);
    });

    it('should create an owner successfully', () => {
      const id = EntityId.create().value!.id;
      const result = BudgetParticipant.create({
        id,
        role: ParticipantRole.OWNER,
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(id);
      expect(result.data!.role).toBe(ParticipantRole.OWNER);
      expect(result.data!.isOwner()).toBe(true);
    });

    it('should return error when id is invalid', () => {
      const result = BudgetParticipant.create({ id: 'invalid-id' });

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('InvalidEntityIdError');
    });
  });
});

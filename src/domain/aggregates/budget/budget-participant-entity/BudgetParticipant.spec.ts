import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { InvalidEntityIdError } from './../../../shared/errors/InvalidEntityIdError';
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
      expect(result.errors[0]).toEqual(new InvalidEntityIdError('invalid-id'));
    });

    it('should create with default role when not specified', () => {
      const id = EntityId.create().value!.id;
      const result = BudgetParticipant.create({ id, role: undefined });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.role).toBe(ParticipantRole.PARTICIPANT);
    });
  });

  describe('getters', () => {
    it('should return id', () => {
      const id = EntityId.create().value!.id;
      const result = BudgetParticipant.create({ id });

      expect(result.data!.id).toBe(id);
    });

    it('should return role', () => {
      const id = EntityId.create().value!.id;
      const result = BudgetParticipant.create({
        id,
        role: ParticipantRole.OWNER,
      });

      expect(result.data!.role).toBe(ParticipantRole.OWNER);
    });
  });

  describe('isOwner', () => {
    it('should return true for owner role', () => {
      const id = EntityId.create().value!.id;
      const result = BudgetParticipant.create({
        id,
        role: ParticipantRole.OWNER,
      });

      expect(result.data!.isOwner()).toBe(true);
    });

    it('should return false for participant role', () => {
      const id = EntityId.create().value!.id;
      const result = BudgetParticipant.create({
        id,
        role: ParticipantRole.PARTICIPANT,
      });

      expect(result.data!.isOwner()).toBe(false);
    });
  });
});

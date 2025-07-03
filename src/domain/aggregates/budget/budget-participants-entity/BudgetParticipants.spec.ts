import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { InvalidEntityIdError } from './../../../shared/errors/InvalidEntityIdError';
import { NotFoundError } from './../../../shared/errors/NotFoundError';
import { BudgetParticipants } from './BudgetParticipants';

describe('BudgetParticipants', () => {
  describe('create', () => {
    it('should create participants successfully', () => {
      const participantId = EntityId.create().value!.id;

      const result = BudgetParticipants.create({
        participantIds: [participantId],
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.participants).toContain(participantId);
      expect(result.data!.participantCount).toBe(1);
    });

    it('should return error when participant id is invalid', () => {
      const result = BudgetParticipants.create({
        participantIds: ['invalid-id'],
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('InvalidEntityIdError');
    });

    it('should create with empty participants list', () => {
      const result = BudgetParticipants.create({
        participantIds: [],
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.participants).toHaveLength(0);
      expect(result.data!.participantCount).toBe(0);
    });
  });

  describe('addParticipant', () => {
    it('should add participant successfully', () => {
      const participantId = EntityId.create().value!.id;

      const participants = BudgetParticipants.create({
        participantIds: [],
      }).data!;

      const result = participants.addParticipant(participantId);

      expect(result.hasError).toBe(false);
      expect(participants.participants).toContain(participantId);
      expect(participants.participantCount).toBe(1);
    });

    it('should not add the same participant twice', () => {
      const participantId = EntityId.create().value!.id;

      const participants = BudgetParticipants.create({
        participantIds: [participantId],
      }).data!;

      const result = participants.addParticipant(participantId);

      expect(result.hasError).toBe(false);
      expect(participants.participants).toHaveLength(1);
      expect(participants.participantCount).toBe(1);
    });

    it('should return error when participant id is invalid', () => {
      const participants = BudgetParticipants.create({
        participantIds: [],
      }).data!;

      const result = participants.addParticipant('invalid-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityIdError('invalid-id'));
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant successfully', () => {
      const participantId = EntityId.create().value!.id;

      const participants = BudgetParticipants.create({
        participantIds: [participantId],
      }).data!;

      const result = participants.removeParticipant(participantId);

      expect(result.hasError).toBe(false);
      expect(participants.participants).not.toContain(participantId);
      expect(participants.participantCount).toBe(0);
    });

    it('should return error when participant does not exist', () => {
      const nonExistentId = EntityId.create().value!.id;

      const participants = BudgetParticipants.create({
        participantIds: [],
      }).data!;

      const result = participants.removeParticipant(nonExistentId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new NotFoundError('participantId'));
    });
  });

  describe('getters', () => {
    it('should return participants list', () => {
      const participantId = EntityId.create().value!.id;

      const participants = BudgetParticipants.create({
        participantIds: [participantId],
      }).data!;

      expect(participants.participants).toContain(participantId);
    });

    it('should return participant count', () => {
      const participantId = EntityId.create().value!.id;

      const participants = BudgetParticipants.create({
        participantIds: [participantId],
      }).data!;

      expect(participants.participantCount).toBe(1);
    });
  });
});

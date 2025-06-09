import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { Budget, CreateBudgetDTO } from './Budget';

describe('Budget', () => {
  describe('create', () => {
    it('should create a budget successfully', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;

      const result = Budget.create({
        name,
        ownerId,
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.name).toBe(name);
      expect(result.data!.ownerId).toBe(ownerId);
      expect(result.data!.participants).toContain(ownerId);
    });

    it('should create a budget with empty participants list', () => {
      const ownerId = EntityId.create().value!.id;

      const data: CreateBudgetDTO = {
        name: 'Test Budget',
        ownerId,
        participantIds: [],
      };

      const result = Budget.create(data);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.participants).toContain(ownerId);
      expect(result.data!.participants.length).toBe(1);
    });

    it('should create a budget with null participants list', () => {
      const ownerId = EntityId.create().value!.id;

      const data: CreateBudgetDTO = {
        name: 'Test Budget',
        ownerId,
        participantIds: undefined,
      };

      const result = Budget.create(data);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.participants).toContain(ownerId);
      expect(result.data!.participants.length).toBe(1);
    });

    it('should create a budget with additional participants', () => {
      const ownerId = EntityId.create().value!.id;
      const participantId = EntityId.create().value!.id;

      const data: CreateBudgetDTO = {
        name: 'Test Budget',
        ownerId,
        participantIds: [participantId],
      };

      const result = Budget.create(data);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data!.participants).toContain(ownerId);
      expect(result.data!.participants).toContain(participantId);
    });

    it('should return error when name is invalid', () => {
      const result = Budget.create({
        name: '',
        ownerId: EntityId.create().value!.id,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('InvalidEntityNameError');
    });

    it('should return error when name is too long', () => {
      const result = Budget.create({
        name: 'a'.repeat(256),
        ownerId: EntityId.create().value!.id,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('InvalidEntityNameError');
    });

    it('should return error when owner id is invalid', () => {
      const result = Budget.create({
        name: 'Test Budget',
        ownerId: 'invalid-id',
      });

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
    it('should add participant successfully', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;
      const participantId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
      }).data!;

      const result = budget.addParticipant(participantId);

      expect(result.hasError).toBe(false);
      expect(budget.participants).toContain(participantId);
      expect(budget.participants).toContain(ownerId);
    });

    it('should not add new participant if it already exists', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
      }).data!;

      budget.addParticipant(ownerId);

      expect(budget.participants.length).toBe(1);
    });

    it('should return error when participant id is invalid', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
      }).data!;

      const result = budget.addParticipant('invalid-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('InvalidEntityIdError');
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant successfully', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;
      const participantId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
      }).data!;

      budget.addParticipant(participantId);
      const result = budget.removeParticipant(participantId);

      expect(result.hasError).toBe(false);
      expect(budget.participants).not.toContain(participantId);
      expect(budget.participants).toContain(ownerId);
    });

    it('should return error when participant does not exist', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;
      const nonExistentId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
      }).data!;

      const result = budget.removeParticipant(nonExistentId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('NotFoundError');
    });

    it('should return error when removing owner', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
      }).data!;

      const result = budget.removeParticipant(ownerId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe(
        'CannotRemoveOwnerFromParticipantsError',
      );
    });
  });

  describe('getters', () => {
    it('should return name', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
      }).data!;

      expect(budget.name).toBe(name);
    });

    it('should return owner id', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
      }).data!;

      expect(budget.ownerId).toBe(ownerId);
    });

    it('should return participants', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
      }).data!;

      expect(budget.participants).toContain(ownerId);
    });
  });
});

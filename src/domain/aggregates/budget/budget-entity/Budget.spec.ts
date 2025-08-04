import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { CannotRemoveOwnerFromParticipantsError } from './../../../shared/errors/CannotRemoveOwnerFromParticipantsError';
import { InvalidEntityIdError } from './../../../shared/errors/InvalidEntityIdError';
import { InvalidEntityNameError } from './../../../shared/errors/InvalidEntityNameError';
import { NotFoundError } from './../../../shared/errors/NotFoundError';
import { BudgetTypeEnum } from '../value-objects/budget-type/BudgetType';
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
      expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
    });

    it('should return error when name is too long', () => {
      const result = Budget.create({
        name: 'a'.repeat(256),
        ownerId: EntityId.create().value!.id,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(
        new InvalidEntityNameError('a'.repeat(256)),
      );
    });

    it('should return error when owner id is invalid', () => {
      const result = Budget.create({
        name: 'Test Budget',
        ownerId: 'invalid-id',
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityIdError('invalid-id'));
    });

    it('should return error when participant id is invalid', () => {
      const data: CreateBudgetDTO = {
        name: 'Test Budget',
        ownerId: EntityId.create().value!.id,
        participantIds: ['invalid-id'],
      };

      const result = Budget.create(data);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityIdError('invalid-id'));
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
        type: BudgetTypeEnum.SHARED,
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
        type: BudgetTypeEnum.SHARED,
      }).data!;

      const result = budget.addParticipant('invalid-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityIdError('invalid-id'));
    });

    it('should return error when trying to add participant to personal budget', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;
      const participantId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
        type: BudgetTypeEnum.PERSONAL,
      }).data!;

      const result = budget.addParticipant(participantId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('BudgetNotSharedError');
    });

    it('should return error when participant already exists', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;
      const participantId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
        type: BudgetTypeEnum.SHARED,
      }).data!;

      // Add participant first time
      budget.addParticipant(participantId);

      // Try to add same participant again
      const result = budget.addParticipant(participantId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].name).toBe('ParticipantAlreadyExistsError');
    });

    it('should publish event when participant is added', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;
      const participantId = EntityId.create().value!.id;

      const budget = Budget.create({
        name,
        ownerId,
        type: BudgetTypeEnum.SHARED,
      }).data!;

      budget.clearEvents(); // Clear creation events

      const result = budget.addParticipant(participantId);

      expect(result.hasError).toBe(false);
      const events = budget.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].constructor.name).toBe('ParticipantAddedToBudgetEvent');
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
        type: BudgetTypeEnum.SHARED,
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
      expect(result.errors[0]).toEqual(new NotFoundError('userId'));
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
      expect(result.errors[0]).toEqual(
        new CannotRemoveOwnerFromParticipantsError(),
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

    it('should return budget type', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;

      const personalBudget = Budget.create({
        name,
        ownerId,
        type: BudgetTypeEnum.PERSONAL,
      }).data!;

      const sharedBudget = Budget.create({
        name: 'Shared Budget',
        ownerId,
        type: BudgetTypeEnum.SHARED,
      }).data!;

      expect(personalBudget.type.isPersonal()).toBe(true);
      expect(personalBudget.type.isShared()).toBe(false);
      expect(sharedBudget.type.isShared()).toBe(true);
      expect(sharedBudget.type.isPersonal()).toBe(false);
    });

    it('should auto-detect budget type based on participants', () => {
      const name = 'Test Budget';
      const ownerId = EntityId.create().value!.id;
      const participantId = EntityId.create().value!.id;

      const personalBudget = Budget.create({
        name,
        ownerId,
      }).data!;

      const sharedBudget = Budget.create({
        name: 'Shared Budget',
        ownerId,
        participantIds: [participantId],
      }).data!;

      expect(personalBudget.type.isPersonal()).toBe(true);
      expect(sharedBudget.type.isShared()).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete budget and add event', () => {
      const ownerId = EntityId.create().value!.id;
      const budget = Budget.create({ name: 'Budget', ownerId }).data!;

      const result = budget.delete();

      expect(result.hasError).toBe(false);
      expect(budget.isDeleted).toBe(true);
      expect(budget.getEvents()).toHaveLength(1);
    });

    it('should return error when budget already deleted', () => {
      const ownerId = EntityId.create().value!.id;
      const budget = Budget.create({ name: 'Budget', ownerId }).data!;
      budget.delete();

      const result = budget.delete();

      expect(result.hasError).toBe(true);
    });
  });

  describe('restore', () => {
    it('should restore a budget from persistence data', () => {
      const id = EntityId.create().value!.id;
      const ownerId = EntityId.create().value!.id;
      const participantId = EntityId.create().value!.id;
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');

      const restoreData = {
        id,
        name: 'Restored Budget',
        ownerId,
        participantIds: [ownerId, participantId],
        createdAt,
        updatedAt,
        isDeleted: false,
      };

      const result = Budget.restore(restoreData);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();

      const budget = result.data!;
      expect(budget.id).toBe(id);
      expect(budget.name).toBe('Restored Budget');
      expect(budget.ownerId).toBe(ownerId);
      expect(budget.participants).toEqual([ownerId, participantId]);
      expect(budget.createdAt).toEqual(createdAt);
      expect(budget.updatedAt).toEqual(updatedAt);
      expect(budget.isDeleted).toBe(false);
    });

    it('should restore a deleted budget', () => {
      const id = EntityId.create().value!.id;
      const ownerId = EntityId.create().value!.id;

      const restoreData = {
        id,
        name: 'Deleted Budget',
        ownerId,
        participantIds: [ownerId],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        isDeleted: true,
      };

      const result = Budget.restore(restoreData);

      expect(result.hasError).toBe(false);
      expect(result.data!.isDeleted).toBe(true);
    });

    it('should return error with invalid name', () => {
      const id = EntityId.create().value!.id;
      const ownerId = EntityId.create().value!.id;

      const restoreData = {
        id,
        name: '', // Invalid empty name
        ownerId,
        participantIds: [ownerId],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };

      const result = Budget.restore(restoreData);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityNameError);
    });

    it('should return error with invalid owner id', () => {
      const id = EntityId.create().value!.id;

      const restoreData = {
        id,
        name: 'Valid Budget',
        ownerId: '', // Invalid empty owner ID
        participantIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };

      const result = Budget.restore(restoreData);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityIdError);
    });

    it('should return error with invalid id', () => {
      const ownerId = EntityId.create().value!.id;

      const restoreData = {
        id: '', // Invalid empty ID
        name: 'Valid Budget',
        ownerId,
        participantIds: [ownerId],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };

      const result = Budget.restore(restoreData);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidEntityIdError);
    });

    it('should return error with invalid participant ids', () => {
      const id = EntityId.create().value!.id;
      const ownerId = EntityId.create().value!.id;

      const restoreData = {
        id,
        name: 'Valid Budget',
        ownerId,
        participantIds: ['', 'invalid-id'], // Invalid participant IDs
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };

      const result = Budget.restore(restoreData);

      expect(result.hasError).toBe(true);
    });
  });
});

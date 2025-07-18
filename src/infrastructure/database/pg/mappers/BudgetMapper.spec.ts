import { EntityId } from '../../../../domain/shared/value-objects/entity-id/EntityId';
import { Budget } from '../../../../domain/aggregates/budget/budget-entity/Budget';
import { BudgetMapper, BudgetRow } from './BudgetMapper';

describe('BudgetMapper', () => {
  describe('toDomain', () => {
    it('should convert valid row to Budget entity', () => {
      const id = EntityId.create().value!.id;
      const ownerId = EntityId.create().value!.id;
      const participantId = EntityId.create().value!.id;

      const row: BudgetRow = {
        id,
        name: 'Test Budget',
        owner_id: ownerId,
        participant_ids: [ownerId, participantId],
        is_deleted: false,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
      };

      const result = BudgetMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();

      const budget = result.data!;
      expect(budget.id).toBe(id);
      expect(budget.name).toBe('Test Budget');
      expect(budget.ownerId).toBe(ownerId);
      expect(budget.participants).toEqual([ownerId, participantId]);
      expect(budget.isDeleted).toBe(false);
      expect(budget.createdAt).toEqual(new Date('2023-01-01'));
      expect(budget.updatedAt).toEqual(new Date('2023-01-02'));
    });

    it('should convert row with empty participant_ids', () => {
      const id = EntityId.create().value!.id;
      const ownerId = EntityId.create().value!.id;

      const row: BudgetRow = {
        id,
        name: 'Empty Participants Budget',
        owner_id: ownerId,
        participant_ids: [],
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = BudgetMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.participants).toEqual([]);
    });

    it('should convert row with null participant_ids', () => {
      const id = EntityId.create().value!.id;
      const ownerId = EntityId.create().value!.id;

      const row: BudgetRow = {
        id,
        name: 'Null Participants Budget',
        owner_id: ownerId,
        participant_ids: null as unknown as string[], // Simulating PostgreSQL null
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = BudgetMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.participants).toEqual([]);
    });

    it('should convert deleted budget', () => {
      const id = EntityId.create().value!.id;
      const ownerId = EntityId.create().value!.id;

      const row: BudgetRow = {
        id,
        name: 'Deleted Budget',
        owner_id: ownerId,
        participant_ids: [ownerId],
        is_deleted: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = BudgetMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.isDeleted).toBe(true);
    });

    it('should return error with invalid name', () => {
      const id = EntityId.create().value!.id;
      const ownerId = EntityId.create().value!.id;

      const row: BudgetRow = {
        id,
        name: '', // Invalid empty name
        owner_id: ownerId,
        participant_ids: [ownerId],
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = BudgetMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });

    it('should return error with invalid owner_id', () => {
      const id = EntityId.create().value!.id;

      const row: BudgetRow = {
        id,
        name: 'Valid Name',
        owner_id: '', // Invalid empty owner_id
        participant_ids: [],
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = BudgetMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });

    it('should return error with invalid id', () => {
      const ownerId = EntityId.create().value!.id;

      const row: BudgetRow = {
        id: '', // Invalid empty id
        name: 'Valid Name',
        owner_id: ownerId,
        participant_ids: [ownerId],
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = BudgetMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });
  });

  describe('toRow', () => {
    it('should convert Budget entity to row', () => {
      const ownerId = EntityId.create().value!.id;
      const participantId = EntityId.create().value!.id;

      const budget = Budget.create({
        name: 'Test Budget',
        ownerId,
        participantIds: [participantId],
      }).data!;

      const row = BudgetMapper.toRow(budget);

      expect(row.id).toBe(budget.id);
      expect(row.name).toBe('Test Budget');
      expect(row.owner_id).toBe(ownerId);
      expect(row.participant_ids).toEqual(budget.participants);
      expect(row.is_deleted).toBe(false);
      expect(row.created_at).toEqual(budget.createdAt);
      expect(row.updated_at).toEqual(budget.updatedAt);
    });

    it('should convert deleted Budget entity to row', () => {
      const ownerId = EntityId.create().value!.id;

      const budget = Budget.create({
        name: 'Test Budget',
        ownerId,
      }).data!;

      budget.delete();

      const row = BudgetMapper.toRow(budget);

      expect(row.is_deleted).toBe(true);
      expect(row.updated_at).toEqual(budget.updatedAt);
    });

    it('should convert Budget with empty participants to row', () => {
      const ownerId = EntityId.create().value!.id;

      const budget = Budget.create({
        name: 'Empty Participants Budget',
        ownerId,
        participantIds: [],
      }).data!;

      const row = BudgetMapper.toRow(budget);

      expect(row.participant_ids).toContain(ownerId); // Owner is always added
    });
  });
});

import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { AddGoalRepository } from './AddGoalRepository';

describe('AddGoalRepository', () => {
  let repository: AddGoalRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
    };

    repository = new AddGoalRepository(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createValidGoal = (): Goal => {
    return Goal.create({
      name: 'Emergency Fund',
      totalAmount: 100000,
      budgetId: EntityId.create().value!.id,
      accumulatedAmount: 25000,
    }).data!;
  };

  describe('execute', () => {
    it('should add goal successfully', async () => {
      const goal = createValidGoal();

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO goals'),
        expect.arrayContaining([
          goal.id,
          'Emergency Fund',
          100000,
          25000,
          null, // deadline
          goal.budgetId,
          false, // is_achieved
          false, // is_deleted
          goal.createdAt,
          goal.updatedAt,
        ]),
      );
    });

    it('should call INSERT with correct SQL structure', async () => {
      const goal = createValidGoal();

      await repository.execute(goal);

      const [query, params] = mockConnection.query.mock.calls[0];
      expect(query).toContain('INSERT INTO goals');
      expect(query).toContain(
        'id, name, total_amount, accumulated_amount, deadline, budget_id',
      );
      expect(query).toContain(
        'is_achieved, is_deleted, created_at, updated_at',
      );
      expect(query).toContain(
        'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      );
      expect(params).toHaveLength(10);
    });

    it('should handle goal with deadline', async () => {
      const deadline = new Date('2025-12-31');
      const goal = Goal.create({
        name: 'Vacation Goal',
        totalAmount: 50000,
        budgetId: EntityId.create().value!.id,
        deadline,
        accumulatedAmount: 10000,
      }).data!;

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO goals'),
        expect.arrayContaining([deadline]),
      );
    });

    it('should handle achieved goal', async () => {
      const goal = Goal.create({
        name: 'Achieved Goal',
        totalAmount: 50000,
        budgetId: EntityId.create().value!.id,
        accumulatedAmount: 50000, // Same as total = achieved
      }).data!;

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO goals'),
        expect.arrayContaining([true]), // is_achieved = true
      );
    });

    it('should handle deleted goal', async () => {
      const goal = createValidGoal();
      goal.delete();

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO goals'),
        expect.arrayContaining([true]), // is_deleted = true
      );
    });

    it('should return error when database fails with duplicate key', async () => {
      const goal = createValidGoal();
      const dbError = new Error('Duplicate key violation') as Error & {
        code: string;
      };
      dbError.code = '23505';

      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Goal with id already exists');
    });

    it('should return error when database fails with generic error', async () => {
      const goal = createValidGoal();
      const dbError = new Error('Database connection failed');

      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to add goal');
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should handle unknown error type', async () => {
      const goal = createValidGoal();
      const unknownError = 'Unknown error string';

      mockConnection.query.mockRejectedValue(unknownError);

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to add goal');
      expect(result.errors[0].message).toContain('Unknown error');
    });
  });
});

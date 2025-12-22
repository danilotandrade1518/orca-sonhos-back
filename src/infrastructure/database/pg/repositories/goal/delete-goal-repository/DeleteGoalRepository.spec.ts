import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { DeleteGoalRepository } from './DeleteGoalRepository';

describe('DeleteGoalRepository', () => {
  let repository: DeleteGoalRepository;
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
    repository = new DeleteGoalRepository(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete goal successfully', async () => {
      const goalId = EntityId.create().value!.id;
      mockConnection.query.mockResolvedValue({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goalId);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        [goalId],
      );
    });

    it('should call UPDATE with correct SQL structure', async () => {
      const goalId = EntityId.create().value!.id;
      mockConnection.query.mockResolvedValue({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      await repository.execute(goalId);

      const [query, params] = mockConnection.query.mock.calls[0];
      expect(query).toContain('UPDATE goals');
      expect(query).toContain('is_deleted = true');
      expect(query).toContain('updated_at = NOW()');
      expect(query).toContain('WHERE id = $1 AND is_deleted = false');
      expect(params).toEqual([goalId]);
      expect(params).toHaveLength(1);
    });

    it('should only update non-deleted goals', async () => {
      const goalId = EntityId.create().value!.id;
      mockConnection.query.mockResolvedValue({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      await repository.execute(goalId);

      const [query] = mockConnection.query.mock.calls[0];
      expect(query).toContain('is_deleted = false');
    });

    it('should set updated_at to current time', async () => {
      const goalId = EntityId.create().value!.id;
      mockConnection.query.mockResolvedValue({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      await repository.execute(goalId);

      const [query] = mockConnection.query.mock.calls[0];
      expect(query).toContain('updated_at = NOW()');
    });

    it('should handle different valid goal IDs', async () => {
      const goalId1 = EntityId.create().value!.id;
      const goalId2 = EntityId.create().value!.id;

      mockConnection.query.mockResolvedValue({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result1 = await repository.execute(goalId1);
      const result2 = await repository.execute(goalId2);

      expect(result1.hasError).toBe(false);
      expect(result2.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        [goalId1],
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        [goalId2],
      );
    });

    it('should return error when goal not found', async () => {
      const goalId = EntityId.create().value!.id;
      mockConnection.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute(goalId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Goal with id');
      expect(result.errors[0].message).toContain('not found for deletion');
      expect(result.errors[0].message).toContain(goalId);
    });

    it('should return error when query returns null', async () => {
      const goalId = EntityId.create().value!.id;
      mockConnection.query.mockResolvedValue(null);

      const result = await repository.execute(goalId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('not found for deletion');
    });

    it('should return error when database fails', async () => {
      const goalId = EntityId.create().value!.id;
      const dbError = new Error('Database connection failed');
      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(goalId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to delete goal');
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should handle string goal ID correctly', async () => {
      const goalId = 'fixed-goal-id-123';
      mockConnection.query.mockResolvedValue({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goalId);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        [goalId],
      );
    });

    it('should handle already deleted goal (no rows affected)', async () => {
      const goalId = EntityId.create().value!.id;

      mockConnection.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute(goalId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].message).toContain('not found for deletion');
    });

    it('should perform soft delete, not hard delete', async () => {
      const goalId = EntityId.create().value!.id;
      mockConnection.query.mockResolvedValue({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      await repository.execute(goalId);

      const [query] = mockConnection.query.mock.calls[0];
      expect(query).toContain('UPDATE goals');
      expect(query).not.toContain('DELETE FROM');
      expect(query).toContain('is_deleted = true');
    });

    it('should handle deletion of achieved goals', async () => {
      const goalId = EntityId.create().value!.id;
      mockConnection.query.mockResolvedValue({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goalId);

      expect(result.hasError).toBe(false);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        [goalId],
      );
    });

    it('should handle deletion of goals with different amounts', async () => {
      const goalId = EntityId.create().value!.id;
      mockConnection.query.mockResolvedValue({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goalId);

      expect(result.hasError).toBe(false);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        [goalId],
      );
    });
  });
});

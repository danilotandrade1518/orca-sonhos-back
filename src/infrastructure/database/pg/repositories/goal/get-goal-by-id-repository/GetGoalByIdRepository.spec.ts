import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { GoalMapper, GoalRow } from '../../../mappers/goal/GoalMapper';
import { GetGoalByIdRepository } from './GetGoalByIdRepository';

jest.mock('../../../mappers/goal/GoalMapper');

class TestDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'TestDomainError';
  }
}

describe('GetGoalByIdRepository', () => {
  let repository: GetGoalByIdRepository;
  let mockConnectionAdapter: IPostgresConnectionAdapter;
  let mockQuery: jest.Mock;

  const validId = '550e8400-e29b-41d4-a716-446655440001';
  const goalId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    mockQuery = jest.fn();

    mockConnectionAdapter = {
      query: mockQuery,
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new GetGoalByIdRepository(mockConnectionAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return goal when found', async () => {
      const mockRow: GoalRow = {
        id: goalId,
        name: 'Meta de Aposentadoria',
        total_amount: 100000.0,
        accumulated_amount: 25000.0,
        deadline: new Date('2030-12-31T23:59:59Z'),
        budget_id: '550e8400-e29b-41d4-a716-446655440003',
        source_account_id: '550e8400-e29b-41d4-a716-446655440004',
        is_deleted: false,
        created_at: new Date('2024-01-15T10:00:00Z'),
        updated_at: new Date('2024-01-15T10:00:00Z'),
      };

      const mockGoal = {
        id: goalId,
        name: 'Meta de Aposentadoria',
        totalAmount: 100000.0,
        accumulatedAmount: 25000.0,
        deadline: new Date('2030-12-31T23:59:59Z'),
        budgetId: '550e8400-e29b-41d4-a716-446655440003',
        isDeleted: false,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
        isAchieved: () => false,
      } as Goal;

      mockQuery.mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      });
      jest
        .spyOn(GoalMapper, 'toDomain')
        .mockReturnValue(Either.success(mockGoal));

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual(mockGoal);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [validId],
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND is_deleted = false'),
        [validId],
      );
    });

    it('should return null when goal not found', async () => {
      mockQuery.mockResolvedValue(null);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [validId],
      );
    });

    it('should filter deleted goals', async () => {
      mockQuery.mockResolvedValue(null);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        [validId],
      );
    });

    it('should return error when database query fails', async () => {
      const databaseError = new Error('Connection timeout');
      mockQuery.mockRejectedValue(databaseError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Connection timeout');
    });

    it('should return error when mapping fails', async () => {
      const mockRow: GoalRow = {
        id: goalId,
        name: 'Meta Inválida',
        total_amount: -1000.0, // Invalid amount
        accumulated_amount: 25000.0,
        deadline: new Date('2030-12-31T23:59:59Z'),
        budget_id: '550e8400-e29b-41d4-a716-446655440003',
        source_account_id: '550e8400-e29b-41d4-a716-446655440004',
        is_deleted: false,
        created_at: new Date('2024-01-15T10:00:00Z'),
        updated_at: new Date('2024-01-15T10:00:00Z'),
      };

      const mappingError = new TestDomainError('Invalid goal amount');
      mockQuery.mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      });
      jest
        .spyOn(GoalMapper, 'toDomain')
        .mockReturnValue(
          Either.error(mappingError) as Either<DomainError, Goal>,
        );

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to map goal from database',
      );
    });

    it('should handle undefined database result', async () => {
      mockQuery.mockResolvedValue(undefined);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should use correct SQL query structure', async () => {
      mockQuery.mockResolvedValue(null);

      await repository.execute(validId);

      const calledQuery = mockQuery.mock.calls[0][0];
      expect(calledQuery).toContain('SELECT');
      expect(calledQuery).toContain(
        'id, name, total_amount, accumulated_amount, deadline, budget_id',
      );
      expect(calledQuery).toContain('source_account_id');
      expect(calledQuery).toContain('is_deleted, created_at, updated_at');
      expect(calledQuery).toContain('FROM goals');
      expect(calledQuery).toContain('WHERE id = $1 AND is_deleted = false');
    });

    it('should handle empty goal ID', async () => {
      mockQuery.mockResolvedValue(null);

      const result = await repository.execute('');

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [''],
      );
    });

    it('should handle special characters in goal ID', async () => {
      const specialId = "'; DROP TABLE goals; --";
      mockQuery.mockResolvedValue(null);

      const result = await repository.execute(specialId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [specialId],
      );
    });

    it('should handle network timeout error', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';
      mockQuery.mockRejectedValue(timeoutError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Connection timeout');
    });

    it('should handle unknown database error', async () => {
      const unknownError = 'Unknown database error';
      mockQuery.mockRejectedValue(unknownError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to get goal by id');
    });

    it('should call repository only once per execution', async () => {
      mockQuery.mockResolvedValue(null);

      await repository.execute(validId);
      await repository.execute(validId);

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should preserve goal properties in mapping', async () => {
      const mockRow: GoalRow = {
        id: goalId,
        name: 'Meta Casa Própria',
        total_amount: 500000.0,
        accumulated_amount: 150000.0,
        deadline: new Date('2025-06-30T23:59:59Z'),
        budget_id: '550e8400-e29b-41d4-a716-446655440004',
        source_account_id: '550e8400-e29b-41d4-a716-446655440005',
        is_deleted: false,
        created_at: new Date('2024-02-01T08:30:00Z'),
        updated_at: new Date('2024-02-15T14:45:00Z'),
      };

      const mockGoal = {
        id: goalId,
        name: 'Meta Casa Própria',
        totalAmount: 500000.0,
        accumulatedAmount: 150000.0,
        deadline: new Date('2025-06-30T23:59:59Z'),
        budgetId: '550e8400-e29b-41d4-a716-446655440004',
        isDeleted: false,
        createdAt: new Date('2024-02-01T08:30:00Z'),
        updatedAt: new Date('2024-02-15T14:45:00Z'),
        isAchieved: () => false,
      } as Goal;

      mockQuery.mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      });
      jest
        .spyOn(GoalMapper, 'toDomain')
        .mockReturnValue(Either.success(mockGoal));

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data?.name).toBe('Meta Casa Própria');
      expect(result.data?.totalAmount).toBe(500000.0);
      expect(result.data?.accumulatedAmount).toBe(150000.0);
      expect(result.data?.deadline).toEqual(new Date('2025-06-30T23:59:59Z'));
    });

    it('should handle goal without deadline', async () => {
      const mockRow: GoalRow = {
        id: goalId,
        source_account_id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'Meta sem Prazo',
        total_amount: 50000.0,
        accumulated_amount: 10000.0,
        deadline: null,
        budget_id: '550e8400-e29b-41d4-a716-446655440005',
        is_deleted: false,
        created_at: new Date('2024-01-15T10:00:00Z'),
        updated_at: new Date('2024-01-15T10:00:00Z'),
      };

      const mockGoal = {
        id: goalId,
        name: 'Meta sem Prazo',
        totalAmount: 50000.0,
        accumulatedAmount: 10000.0,
        deadline: undefined,
        budgetId: '550e8400-e29b-41d4-a716-446655440005',
        isDeleted: false,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
        isAchieved: () => false,
      } as Goal;

      mockQuery.mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      });
      jest
        .spyOn(GoalMapper, 'toDomain')
        .mockReturnValue(Either.success(mockGoal));

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data?.deadline).toBeUndefined();
    });
  });
});

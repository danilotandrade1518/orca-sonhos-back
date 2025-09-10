import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { GoalMapper, GoalRow } from '../../../mappers/goal/GoalMapper';
import { GetGoalsByAccountRepository } from './GetGoalsByAccountRepository';

jest.mock('../../../mappers/goal/GoalMapper');

class TestDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'TestDomainError';
  }
}

describe('GetGoalsByAccountRepository', () => {
  let repository: GetGoalsByAccountRepository;
  let mockConnectionAdapter: IPostgresConnectionAdapter;
  let mockQuery: jest.Mock;

  const validAccountId = '550e8400-e29b-41d4-a716-446655440001';
  const goalId1 = '550e8400-e29b-41d4-a716-446655440002';
  const goalId2 = '550e8400-e29b-41d4-a716-446655440003';

  beforeEach(() => {
    mockQuery = jest.fn();

    mockConnectionAdapter = {
      query: mockQuery,
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new GetGoalsByAccountRepository(mockConnectionAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return array of goals when found', async () => {
      const mockRows: GoalRow[] = [
        {
          id: goalId1,
          name: 'Meta de Aposentadoria',
          total_amount: 100000.0,
          accumulated_amount: 25000.0,
          deadline: new Date('2030-12-31T23:59:59Z'),
          budget_id: '550e8400-e29b-41d4-a716-446655440004',
          source_account_id: validAccountId,
          is_deleted: false,
          created_at: new Date('2024-01-15T10:00:00Z'),
          updated_at: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: goalId2,
          name: 'Meta Casa Própria',
          total_amount: 500000.0,
          accumulated_amount: 150000.0,
          deadline: new Date('2025-06-30T23:59:59Z'),
          budget_id: '550e8400-e29b-41d4-a716-446655440005',
          source_account_id: validAccountId,
          is_deleted: false,
          created_at: new Date('2024-02-01T08:30:00Z'),
          updated_at: new Date('2024-02-15T14:45:00Z'),
        },
      ];

      const mockGoals = [
        {
          id: goalId1,
          name: 'Meta de Aposentadoria',
          totalAmount: 100000.0,
          accumulatedAmount: 25000.0,
          deadline: new Date('2030-12-31T23:59:59Z'),
          budgetId: '550e8400-e29b-41d4-a716-446655440004',
          isDeleted: false,
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z'),
          isAchieved: () => false,
        } as Goal,
        {
          id: goalId2,
          name: 'Meta Casa Própria',
          totalAmount: 500000.0,
          accumulatedAmount: 150000.0,
          deadline: new Date('2025-06-30T23:59:59Z'),
          budgetId: '550e8400-e29b-41d4-a716-446655440005',
          isDeleted: false,
          createdAt: new Date('2024-02-01T08:30:00Z'),
          updatedAt: new Date('2024-02-15T14:45:00Z'),
          isAchieved: () => false,
        } as Goal,
      ];

      mockQuery.mockResolvedValue({
        rows: mockRows,
        rowCount: 2,
      });

      jest
        .spyOn(GoalMapper, 'toDomain')
        .mockReturnValueOnce(Either.success(mockGoals[0]))
        .mockReturnValueOnce(Either.success(mockGoals[1]));

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual(mockGoals);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [validAccountId],
      );
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          'WHERE source_account_id = $1 AND is_deleted = false',
        ),
        [validAccountId],
      );
    });

    it('should return empty array when no goals found', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual([]);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [validAccountId],
      );
    });

    it('should handle undefined database result', async () => {
      mockQuery.mockResolvedValue(undefined);

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual([]);
    });

    it('should handle null database result', async () => {
      mockQuery.mockResolvedValue(null);

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual([]);
    });

    it('should filter deleted goals', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual([]);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        [validAccountId],
      );
    });

    it('should return error when database query fails', async () => {
      const databaseError = new Error('Connection timeout');
      mockQuery.mockRejectedValue(databaseError);

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to get goals by account',
      );
      expect(result.errors[0].message).toContain('Connection timeout');
    });

    it('should return error when mapping fails', async () => {
      const mockRow: GoalRow = {
        id: goalId1,
        name: 'Meta Inválida',
        total_amount: -1000.0,
        accumulated_amount: 25000.0,
        deadline: new Date('2030-12-31T23:59:59Z'),
        budget_id: '550e8400-e29b-41d4-a716-446655440004',
        source_account_id: validAccountId,
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

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to map goal from database',
      );
      expect(result.errors[0].message).toContain('Invalid goal amount');
    });

    it('should use correct SQL query structure', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await repository.execute(validAccountId);

      const calledQuery = mockQuery.mock.calls[0][0];
      expect(calledQuery).toContain('SELECT');
      expect(calledQuery).toContain(
        'id, name, total_amount, accumulated_amount, deadline, budget_id',
      );
      expect(calledQuery).toContain('source_account_id');
      expect(calledQuery).toContain('is_deleted, created_at, updated_at');
      expect(calledQuery).toContain('FROM goals');
      expect(calledQuery).toContain(
        'WHERE source_account_id = $1 AND is_deleted = false',
      );
    });

    it('should handle empty account ID', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute('');

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual([]);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE source_account_id = $1'),
        [''],
      );
    });

    it('should handle special characters in account ID', async () => {
      const specialId = "'; DROP TABLE goals; --";
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute(specialId);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual([]);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE source_account_id = $1'),
        [specialId],
      );
    });

    it('should handle network timeout error', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';
      mockQuery.mockRejectedValue(timeoutError);

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Connection timeout');
    });

    it('should handle unknown database error', async () => {
      const unknownError = 'Unknown database error';
      mockQuery.mockRejectedValue(unknownError);

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to get goals by account',
      );
    });

    it('should call repository only once per execution', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await repository.execute(validAccountId);
      await repository.execute(validAccountId);

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should handle single goal result', async () => {
      const mockRow: GoalRow = {
        id: goalId1,
        name: 'Meta Única',
        total_amount: 75000.0,
        accumulated_amount: 25000.0,
        deadline: new Date('2026-12-31T23:59:59Z'),
        budget_id: '550e8400-e29b-41d4-a716-446655440006',
        source_account_id: validAccountId,
        is_deleted: false,
        created_at: new Date('2024-03-01T12:00:00Z'),
        updated_at: new Date('2024-03-15T16:30:00Z'),
      };

      const mockGoal = {
        id: goalId1,
        name: 'Meta Única',
        totalAmount: 75000.0,
        accumulatedAmount: 25000.0,
        deadline: new Date('2026-12-31T23:59:59Z'),
        budgetId: '550e8400-e29b-41d4-a716-446655440006',
        isDeleted: false,
        createdAt: new Date('2024-03-01T12:00:00Z'),
        updatedAt: new Date('2024-03-15T16:30:00Z'),
        isAchieved: () => false,
      } as Goal;

      mockQuery.mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      });

      jest
        .spyOn(GoalMapper, 'toDomain')
        .mockReturnValue(Either.success(mockGoal));

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toEqual(mockGoal);
    });

    it('should handle goals without deadline', async () => {
      const mockRow: GoalRow = {
        id: goalId1,
        name: 'Meta sem Prazo',
        total_amount: 50000.0,
        accumulated_amount: 10000.0,
        deadline: null,
        budget_id: '550e8400-e29b-41d4-a716-446655440007',
        source_account_id: validAccountId,
        is_deleted: false,
        created_at: new Date('2024-01-15T10:00:00Z'),
        updated_at: new Date('2024-01-15T10:00:00Z'),
      };

      const mockGoal = {
        id: goalId1,
        name: 'Meta sem Prazo',
        totalAmount: 50000.0,
        accumulatedAmount: 10000.0,
        deadline: undefined,
        budgetId: '550e8400-e29b-41d4-a716-446655440007',
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

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].deadline).toBeUndefined();
    });

    it('should process multiple goals correctly', async () => {
      const mockRows: GoalRow[] = Array.from({ length: 5 }, (_, index) => ({
        id: `550e8400-e29b-41d4-a716-44665544000${index + 2}`,
        name: `Meta ${index + 1}`,
        total_amount: (index + 1) * 10000.0,
        accumulated_amount: (index + 1) * 2500.0,
        deadline: new Date(`202${5 + index}-12-31T23:59:59Z`),
        budget_id: `550e8400-e29b-41d4-a716-44665544010${index}`,
        source_account_id: validAccountId,
        is_deleted: false,
        created_at: new Date('2024-01-15T10:00:00Z'),
        updated_at: new Date('2024-01-15T10:00:00Z'),
      }));

      const mockGoals = mockRows.map((row) => ({
        id: row.id,
        name: row.name,
        totalAmount: row.total_amount,
        accumulatedAmount: row.accumulated_amount,
        deadline: row.deadline,
        budgetId: row.budget_id,
        isDeleted: false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isAchieved: () => false,
      })) as Goal[];

      mockQuery.mockResolvedValue({
        rows: mockRows,
        rowCount: 5,
      });

      const mapperSpy = jest.spyOn(GoalMapper, 'toDomain');
      mockGoals.forEach((goal) => {
        mapperSpy.mockReturnValueOnce(Either.success(goal));
      });

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveLength(5);
      expect(GoalMapper.toDomain).toHaveBeenCalledTimes(5);
    });

    it('should stop processing on first mapping error', async () => {
      const mockRows: GoalRow[] = [
        {
          id: goalId1,
          name: 'Meta Válida',
          total_amount: 100000.0,
          accumulated_amount: 25000.0,
          deadline: new Date('2030-12-31T23:59:59Z'),
          budget_id: '550e8400-e29b-41d4-a716-446655440004',
          source_account_id: validAccountId,
          is_deleted: false,
          created_at: new Date('2024-01-15T10:00:00Z'),
          updated_at: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: goalId2,
          name: 'Meta Inválida',
          total_amount: -1000.0,
          accumulated_amount: 25000.0,
          deadline: new Date('2030-12-31T23:59:59Z'),
          budget_id: '550e8400-e29b-41d4-a716-446655440005',
          source_account_id: validAccountId,
          is_deleted: false,
          created_at: new Date('2024-01-15T10:00:00Z'),
          updated_at: new Date('2024-01-15T10:00:00Z'),
        },
      ];

      const mappingError = new TestDomainError('Invalid goal amount');
      mockQuery.mockResolvedValue({
        rows: mockRows,
        rowCount: 2,
      });

      const mapperSpy = jest.spyOn(GoalMapper, 'toDomain');
      mapperSpy
        .mockReturnValueOnce(Either.success({} as Goal))
        .mockReturnValueOnce(
          Either.error(mappingError) as Either<DomainError, Goal>,
        );

      const result = await repository.execute(validAccountId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to map goal from database',
      );
      expect(GoalMapper.toDomain).toHaveBeenCalledTimes(2);
    });
  });
});

import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { BudgetMapper, BudgetRow } from '../../../mappers/budget/BudgetMapper';
import { AddBudgetRepository } from './AddBudgetRepository';

jest.mock('../../../mappers/budget/BudgetMapper');

describe('AddBudgetRepository', () => {
  let repository: AddBudgetRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockBudgetMapper: jest.Mocked<typeof BudgetMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      healthCheck: jest.fn(),
      close: jest.fn(),
      getPoolSize: jest.fn(),
      getIdleCount: jest.fn(),
      getWaitingCount: jest.fn(),
    };

    mockBudgetMapper = BudgetMapper as jest.Mocked<typeof BudgetMapper>;
    repository = new AddBudgetRepository(mockConnection);
  });

  describe('execute', () => {
    it('should add budget successfully', async () => {
      const mockBudget = Budget.restore({
        id: 'budget-id',
        name: 'Test Budget',
        ownerId: 'owner-id',
        participantIds: ['participant-1'],
        isDeleted: false,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      }).data!;

      const mockRow = {
        id: 'budget-id',
        name: 'Test Budget',
        owner_id: 'owner-id',
        participant_ids: ['participant-1'],
        is_deleted: false,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
      };

      mockBudgetMapper.toRow.mockReturnValue({ ...mockRow });
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute(mockBudget);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO budgets'),
        [
          mockRow.id,
          mockRow.name,
          mockRow.owner_id,
          JSON.stringify(mockRow.participant_ids),
          mockRow.is_deleted,
          mockRow.created_at,
          mockRow.updated_at,
        ],
      );
    });

    it('should return error when budget already exists', async () => {
      const mockBudget = Budget.restore({
        id: 'existing-budget-id',
        name: 'Test Budget',
        ownerId: 'owner-id',
        participantIds: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).data!;

      mockBudgetMapper.toRow.mockReturnValue({} as unknown as BudgetRow);
      const constraintError = new Error('duplicate key value') as Error & {
        code?: string;
      };
      constraintError.code = '23505';
      mockConnection.queryOne.mockRejectedValue(constraintError);

      const result = await repository.execute(mockBudget);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Budget with id already exists',
      );
    });

    it('should return error when database throws general error', async () => {
      const mockBudget = Budget.restore({
        id: 'budget-id',
        name: 'Test Budget',
        ownerId: 'owner-id',
        participantIds: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).data!;

      mockBudgetMapper.toRow.mockReturnValue({} as unknown as BudgetRow);
      mockConnection.queryOne.mockRejectedValue(new Error('Connection failed'));

      const result = await repository.execute(mockBudget);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to add budget');
    });

    it('should use correct SQL query', async () => {
      const mockBudget = Budget.restore({
        id: 'budget-id',
        name: 'Test Budget',
        ownerId: 'owner-id',
        participantIds: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).data!;

      const row = {
        id: 'budget-id',
        name: 'Test Budget',
        owner_id: 'owner-id',
        participant_ids: [],
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockConnection.queryOne.mockResolvedValue(null);

      await repository.execute(mockBudget);

      const expected =
        /INSERT INTO budgets\s*\(\s*id, name, owner_id, participant_ids, is_deleted, created_at, updated_at\s*\)\s*VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7\)/;
      expect(mockConnection.queryOne.mock.calls[0][0]).toMatch(expected);
    });

    it('should handle non-Error exceptions', async () => {
      const mockBudget = Budget.restore({
        id: 'budget-id',
        name: 'Test Budget',
        ownerId: 'owner-id',
        participantIds: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).data!;

      mockBudgetMapper.toRow.mockReturnValue({} as unknown as BudgetRow);
      mockConnection.queryOne.mockRejectedValue('fail');

      const result = await repository.execute(mockBudget);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].cause).toBeInstanceOf(Error);
      expect(result.errors[0].cause!.message).toBe('Unknown error');
    });

    it('should call queryOne once', async () => {
      const mockBudget = Budget.restore({
        id: 'budget-id',
        name: 'Test Budget',
        ownerId: 'owner-id',
        participantIds: [],
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).data!;

      const row = {
        id: 'budget-id',
        name: 'Test Budget',
        owner_id: 'owner-id',
        participant_ids: [],
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockConnection.queryOne.mockResolvedValue(null);

      await repository.execute(mockBudget);

      expect(mockConnection.queryOne).toHaveBeenCalledTimes(1);
    });
  });
});

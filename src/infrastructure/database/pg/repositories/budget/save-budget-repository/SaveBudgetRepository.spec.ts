import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { BudgetMapper, BudgetRow } from '../../../mappers/budget/BudgetMapper';
import { SaveBudgetRepository } from './SaveBudgetRepository';

jest.mock('../../../mappers/budget/BudgetMapper');

describe('SaveBudgetRepository', () => {
  let repository: SaveBudgetRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockBudgetMapper: jest.Mocked<typeof BudgetMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    mockBudgetMapper = BudgetMapper as jest.Mocked<typeof BudgetMapper>;
    repository = new SaveBudgetRepository(mockConnection);
  });

  describe('execute', () => {
    const budget = Budget.restore({
      id: EntityId.create().value!.id,
      name: 'Test Budget',
      ownerId: EntityId.create().value!.id,
      participantIds: [EntityId.create().value!.id],
      isDeleted: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
    }).data!;

    const row: BudgetRow = {
      id: budget.id,
      name: budget.name,
      owner_id: budget.ownerId,
      participant_ids: budget.participants,
      type: budget.type,
      is_deleted: budget.isDeleted,
      created_at: budget.createdAt,
      updated_at: budget.updatedAt,
    };

    it('should save budget successfully', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute(budget);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(expect.any(String), [
        row.id,
        row.name,
        row.participant_ids,
        row.is_deleted,
        expect.any(Date),
      ]);
    });

    it('should update existing budget', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockConnection.queryOne.mockResolvedValue(null);

      await repository.execute(budget);

      const calledQuery: string = mockConnection.queryOne.mock.calls[0][0];
      expect(calledQuery).toContain('UPDATE budgets SET');
    });

    it('should return error when database query fails', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      const dbError = new Error('DB fail');
      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute(budget);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].cause).toBe(dbError);
    });

    it('should return error when mapping fails', async () => {
      const mapError = new Error('map');
      mockBudgetMapper.toRow.mockImplementation(() => {
        throw mapError;
      });

      const result = await repository.execute(budget);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to map budget');
    });

    it('should use correct SQL query', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockConnection.queryOne.mockResolvedValue(null);

      await repository.execute(budget);

      const expected =
        /UPDATE budgets SET[\s\S]*updated_at = \$5[\s\S]*WHERE id = \$1/;
      expect(mockConnection.queryOne.mock.calls[0][0]).toMatch(expected);
    });

    it('should handle non-Error exceptions', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockConnection.queryOne.mockRejectedValue('string-error');

      const result = await repository.execute(budget);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].cause).toBeInstanceOf(Error);
      expect(result.errors[0].cause!.message).toBe('Unknown error');
    });

    it('should call queryOne once', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockConnection.queryOne.mockResolvedValue(null);

      await repository.execute(budget);

      expect(mockConnection.queryOne).toHaveBeenCalledTimes(1);
    });
  });
});

import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import { BudgetMapper, BudgetRow } from '../../../mappers/BudgetMapper';
import { SaveBudgetRepository } from './SaveBudgetRepository';

jest.mock('../../../connection/PostgreSQLConnection');
jest.mock('../../../mappers/BudgetMapper');

describe('SaveBudgetRepository', () => {
  let repository: SaveBudgetRepository;
  let mockQueryOne: jest.MockedFunction<PostgreSQLConnection['queryOne']>;
  let mockBudgetMapper: jest.Mocked<typeof BudgetMapper>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryOne = jest.fn();
    mockBudgetMapper = BudgetMapper as jest.Mocked<typeof BudgetMapper>;
    (PostgreSQLConnection.getInstance as jest.Mock).mockReturnValue({
      queryOne: mockQueryOne,
    });
    repository = new SaveBudgetRepository();
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
      is_deleted: budget.isDeleted,
      created_at: budget.createdAt,
      updated_at: budget.updatedAt,
    };

    it('should save budget successfully', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute(budget);

      expect(result.hasError).toBe(false);
      expect(mockQueryOne).toHaveBeenCalledWith(expect.any(String), [
        row.id,
        row.name,
        row.participant_ids,
        row.is_deleted,
        expect.any(Date),
      ]);
    });

    it('should update existing budget', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockQueryOne.mockResolvedValue(null);

      await repository.execute(budget);

      const calledQuery: string = mockQueryOne.mock.calls[0][0];
      expect(calledQuery).toContain('UPDATE budgets SET');
    });

    it('should return error when database query fails', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      const dbError = new Error('DB fail');
      mockQueryOne.mockRejectedValue(dbError);

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
      mockQueryOne.mockResolvedValue(null);

      await repository.execute(budget);

      const expected =
        /UPDATE budgets SET[\s\S]*updated_at = \$5[\s\S]*WHERE id = \$1/;
      expect(mockQueryOne.mock.calls[0][0]).toMatch(expected);
    });

    it('should handle non-Error exceptions', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockQueryOne.mockRejectedValue('string-error');

      const result = await repository.execute(budget);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].cause).toBeInstanceOf(Error);
      expect(result.errors[0].cause!.message).toBe('Unknown error');
    });

    it('should call queryOne once', async () => {
      mockBudgetMapper.toRow.mockReturnValue({ ...row });
      mockQueryOne.mockResolvedValue(null);

      await repository.execute(budget);

      expect(mockQueryOne).toHaveBeenCalledTimes(1);
    });
  });
});

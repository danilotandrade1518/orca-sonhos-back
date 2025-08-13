import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { BudgetMapper, BudgetRow } from '../../../mappers/budget/BudgetMapper';
import { GetBudgetRepository } from './GetBudgetRepository';

// Mock do BudgetMapper
jest.mock('../../../mappers/budget/BudgetMapper');

class TestDomainError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

describe('GetBudgetRepository', () => {
  let repository: GetBudgetRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockBudgetMapper: jest.Mocked<typeof BudgetMapper>;

  beforeEach(() => {
    // Reset dos mocks
    jest.clearAllMocks();

    // Mock da conexão
    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    mockBudgetMapper = BudgetMapper as jest.Mocked<typeof BudgetMapper>;

    repository = new GetBudgetRepository(mockConnection);
  });

  describe('execute', () => {
    const validId = EntityId.create().value!.id;
    const validBudgetRow: BudgetRow = {
      id: validId,
      name: 'Test Budget',
      owner_id: EntityId.create().value!.id,
      participant_ids: [EntityId.create().value!.id],
      type: BudgetTypeEnum.SHARED,
      is_deleted: false,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-02'),
    };

    it('should return budget when found', async () => {
      const mockBudget = Budget.create({
        name: 'Test Budget',
        ownerId: validBudgetRow.owner_id,
      }).data!;

      mockConnection.query.mockResolvedValue({
        rows: [validBudgetRow],
        rowCount: 1,
      });
      mockBudgetMapper.toDomain.mockReturnValue(Either.success(mockBudget));

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(mockBudget);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [validId],
      );
      expect(mockBudgetMapper.toDomain).toHaveBeenCalledWith(validBudgetRow);
    });

    it('should return null when budget not found', async () => {
      mockConnection.query.mockResolvedValue(null);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND is_deleted = false'),
        [validId],
      );
      expect(mockBudgetMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should filter deleted budgets', async () => {
      mockConnection.query.mockResolvedValue(null);

      await repository.execute(validId);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        [validId],
      );
    });

    it('should return error when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toBe('Database error');
      expect(result.errors[0].cause).toBe(dbError);
    });

    it('should return error when budget mapping fails', async () => {
      const mappingError = new TestDomainError('Invalid domain data');
      mockConnection.query.mockResolvedValue({
        rows: [validBudgetRow],
        rowCount: 1,
      });
      mockBudgetMapper.toDomain.mockReturnValue(Either.error(mappingError));

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to map budget');
    });

    it('should use correct SQL query', async () => {
      mockConnection.query.mockResolvedValue(null);

      await repository.execute(validId);

      const expectedQuery = expect.stringMatching(
        /SELECT[\s\S]*id,[\s\S]*name,[\s\S]*owner_id,[\s\S]*participant_ids,[\s\S]*type,[\s\S]*is_deleted,[\s\S]*created_at,[\s\S]*updated_at[\s\S]*FROM budgets[\s\S]*WHERE id = \$1 AND is_deleted = false/,
      );

      expect(mockConnection.query).toHaveBeenCalledWith(expectedQuery, [
        validId,
      ]);
    });

    it('should handle non-Error exceptions', async () => {
      const nonErrorException = 'String error';
      mockConnection.query.mockRejectedValue(nonErrorException);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].cause).toBeInstanceOf(Error);
      expect(result.errors[0].cause!.message).toBe('Unknown error');
    });

    it('should use query method for single result', async () => {
      mockConnection.query.mockResolvedValue(null);

      await repository.execute(validId);

      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [
        validId,
      ]);
    });
  });
});

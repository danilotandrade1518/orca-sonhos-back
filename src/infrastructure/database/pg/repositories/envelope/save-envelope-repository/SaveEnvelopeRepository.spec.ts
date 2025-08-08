import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { EnvelopeMapper } from '../../../mappers/envelope/EnvelopeMapper';
import { SaveEnvelopeRepository } from './SaveEnvelopeRepository';

jest.mock('../../../mappers/envelope/EnvelopeMapper');

describe('SaveEnvelopeRepository', () => {
  let repository: SaveEnvelopeRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockMapper: jest.Mocked<typeof EnvelopeMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    mockMapper = EnvelopeMapper as jest.Mocked<typeof EnvelopeMapper>;
    repository = new SaveEnvelopeRepository(mockConnection);
  });

  describe('execute', () => {
    const createValidEnvelope = (): Envelope => {
      const result = Envelope.create({
        name: 'Test Envelope',
        monthlyLimit: 10000,
        budgetId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
      });
      return result.data!;
    };

    it('should save envelope successfully', async () => {
      const envelope = createValidEnvelope();
      const row = {
        id: envelope.id,
        name: 'Test Envelope',
        monthly_limit: '100.00',
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: '0.00',
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: envelope.updatedAt,
      };

      mockMapper.toRow.mockReturnValue(row);
      mockConnection.queryOne.mockResolvedValue(undefined);

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(false);
      expect(mockMapper.toRow).toHaveBeenCalledWith(envelope);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE envelopes'),
        expect.arrayContaining([
          row.id,
          row.name,
          row.monthly_limit,
          row.current_balance,
          row.is_deleted,
          row.updated_at,
        ]),
      );
    });

    it('should update existing envelope', async () => {
      const envelope = createValidEnvelope();
      mockMapper.toRow.mockReturnValue({
        id: envelope.id,
        name: 'Updated Envelope',
        monthly_limit: '200.00',
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: '50.00',
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: new Date(),
      });
      mockConnection.queryOne.mockResolvedValue(undefined);

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SET'),
        expect.any(Array),
      );
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        expect.any(Array),
      );
    });

    it('should call UPDATE with correct parameters', async () => {
      const envelope = createValidEnvelope();
      const row = {
        id: envelope.id,
        name: 'Test Envelope',
        monthly_limit: '100.00',
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: '25.50',
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: envelope.updatedAt,
      };

      mockMapper.toRow.mockReturnValue(row);
      mockConnection.queryOne.mockResolvedValue(undefined);

      await repository.execute(envelope);

      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('name = $2'),
        expect.any(Array),
      );
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('monthly_limit = $3'),
        expect.any(Array),
      );
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('current_balance = $4'),
        expect.any(Array),
      );
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = $5'),
        expect.any(Array),
      );
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('updated_at = $6'),
        expect.any(Array),
      );
    });

    it('should return error when db fails', async () => {
      const envelope = createValidEnvelope();
      const dbError = new Error('Database connection failed');

      mockMapper.toRow.mockReturnValue({
        id: envelope.id,
        name: 'Test Envelope',
        monthly_limit: '100.00',
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: '0.00',
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: envelope.updatedAt,
      });
      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(DomainError);
      expect(result.errors[0].message).toContain('Failed to save envelope');
    });

    it('should handle unknown errors', async () => {
      const envelope = createValidEnvelope();
      const unknownError = 'Unknown error';

      mockMapper.toRow.mockReturnValue({
        id: envelope.id,
        name: 'Test Envelope',
        monthly_limit: '100.00',
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: '0.00',
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: envelope.updatedAt,
      });
      mockConnection.queryOne.mockRejectedValue(unknownError);

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(DomainError);
      expect(result.errors[0].message).toContain('Unknown error');
    });

    it('should use correct SQL structure', async () => {
      const envelope = createValidEnvelope();
      mockMapper.toRow.mockReturnValue({
        id: envelope.id,
        name: 'Test Envelope',
        monthly_limit: '100.00',
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: '0.00',
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: envelope.updatedAt,
      });
      mockConnection.queryOne.mockResolvedValue(undefined);

      await repository.execute(envelope);

      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE envelopes'),
        expect.any(Array),
      );
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('SET'),
        expect.any(Array),
      );
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        expect.any(Array),
      );
    });
  });
});

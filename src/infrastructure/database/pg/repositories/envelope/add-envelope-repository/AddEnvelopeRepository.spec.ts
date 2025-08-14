import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { EnvelopeMapper } from '../../../mappers/envelope/EnvelopeMapper';
import { AddEnvelopeRepository } from './AddEnvelopeRepository';

jest.mock('../../../mappers/envelope/EnvelopeMapper');

describe('AddEnvelopeRepository', () => {
  let repository: AddEnvelopeRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockMapper: jest.Mocked<typeof EnvelopeMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    mockMapper = EnvelopeMapper as jest.Mocked<typeof EnvelopeMapper>;
    repository = new AddEnvelopeRepository(mockConnection);
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

    it('should add envelope successfully', async () => {
      const envelope = createValidEnvelope();
      const row = {
        id: envelope.id,
        name: 'Test Envelope',
        monthly_limit: 10000,
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: 0,
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: envelope.updatedAt,
      };

      mockMapper.toRow.mockReturnValue(row);

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(false);
      expect(mockMapper.toRow).toHaveBeenCalledWith(envelope);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO envelopes'),
        expect.arrayContaining([
          row.id,
          row.name,
          row.monthly_limit,
          row.budget_id,
          row.category_id,
          row.current_balance,
          row.is_deleted,
          row.created_at,
          row.updated_at,
        ]),
      );
    });

    it('should return error when envelope already exists', async () => {
      const envelope = createValidEnvelope();
      const duplicateError = new Error('Duplicate key') as Error & {
        code?: string;
      };
      duplicateError.code = '23505';

      mockMapper.toRow.mockReturnValue({
        id: envelope.id,
        name: 'Test Envelope',
        monthly_limit: 10000,
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: 0,
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: envelope.updatedAt,
      });
      mockConnection.query.mockRejectedValue(duplicateError);

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(DomainError);
      expect(result.errors[0].message).toContain('already exists');
    });

    it('should return error on database failure', async () => {
      const envelope = createValidEnvelope();
      const dbError = new Error('Database connection failed');

      mockMapper.toRow.mockReturnValue({
        id: envelope.id,
        name: 'Test Envelope',
        monthly_limit: 10000,
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: 0,
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: envelope.updatedAt,
      });
      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(DomainError);
      expect(result.errors[0].message).toContain('Failed to add envelope');
    });

    it('should handle unknown errors', async () => {
      const envelope = createValidEnvelope();
      const unknownError = 'Unknown error';

      mockMapper.toRow.mockReturnValue({
        id: envelope.id,
        name: 'Test Envelope',
        monthly_limit: 10000,
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: 0,
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: envelope.updatedAt,
      });
      mockConnection.query.mockRejectedValue(unknownError);

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
        monthly_limit: 10000,
        budget_id: envelope.budgetId,
        category_id: envelope.categoryId,
        current_balance: 0,
        is_deleted: false,
        created_at: envelope.createdAt,
        updated_at: envelope.updatedAt,
      });

      await repository.execute(envelope);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO envelopes'),
        expect.any(Array),
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'id, name, monthly_limit, budget_id, category_id',
        ),
        expect.any(Array),
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)'),
        expect.any(Array),
      );
    });
  });
});

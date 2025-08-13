import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  EnvelopeMapper,
  EnvelopeRow,
} from '../../../mappers/envelope/EnvelopeMapper';
import { GetEnvelopeRepository } from './GetEnvelopeRepository';

jest.mock('../../../mappers/envelope/EnvelopeMapper');

class TestDomainError extends DomainError {
  protected fieldName: string = 'test';

  constructor(message: string) {
    super(message);
  }
}

describe('GetEnvelopeRepository', () => {
  let repository: GetEnvelopeRepository;
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
    repository = new GetEnvelopeRepository(mockConnection);
  });

  describe('execute', () => {
    const validId = EntityId.create().value!.id;
    const budgetId = EntityId.create().value!.id;
    const categoryId = EntityId.create().value!.id;

    const createValidRow = (): EnvelopeRow => ({
      id: validId,
      name: 'Test Envelope',
      monthly_limit: '100.00',
      budget_id: budgetId,
      category_id: categoryId,
      current_balance: '50.00',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const createValidEnvelope = (): Envelope => {
      const result = Envelope.create({
        name: 'Test Envelope',
        monthlyLimit: 10000,
        budgetId,
        categoryId,
      });
      return result.data!;
    };

    it('should return envelope when found', async () => {
      const row = createValidRow();
      const envelope = createValidEnvelope();

      mockConnection.query.mockResolvedValue({ rows: [row], rowCount: 1 });
      mockMapper.toDomain.mockReturnValue(Either.success(envelope));

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(envelope);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND is_deleted = false'),
        [validId],
      );
    });

    it('should return null when envelope not found', async () => {
      mockConnection.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should exclude deleted envelopes', async () => {
      await repository.execute(validId);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        expect.any(Array),
      );
    });

    it('should return error when mapping fails', async () => {
      const row = createValidRow();
      const mapperError = new TestDomainError('Mapping failed');

      mockConnection.query.mockResolvedValue({ rows: [row], rowCount: 1 });
      mockMapper.toDomain.mockReturnValue(Either.error(mapperError));

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBe(mapperError);
    });

    it('should return error on database failure', async () => {
      const dbError = new Error('Database connection failed');
      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(DomainError);
      expect(result.errors[0].message).toContain('Failed to get envelope');
    });

    it('should handle unknown errors', async () => {
      const unknownError = 'Unknown error';
      mockConnection.query.mockRejectedValue(unknownError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(DomainError);
      expect(result.errors[0].message).toContain('Unknown error');
    });

    it('should use correct SQL structure', async () => {
      await repository.execute(validId);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.any(Array),
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM envelopes'),
        expect.any(Array),
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'id, name, monthly_limit, budget_id, category_id',
        ),
        expect.any(Array),
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('current_balance, is_deleted'),
        expect.any(Array),
      );
    });
  });
});

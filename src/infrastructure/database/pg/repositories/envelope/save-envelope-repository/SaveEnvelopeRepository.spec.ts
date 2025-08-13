import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../../adapters/IPostgresConnectionAdapter';
import { EnvelopeMapper } from '../../../mappers/envelope/EnvelopeMapper';
import { SaveEnvelopeRepository } from './SaveEnvelopeRepository';

jest.mock('../../../mappers/envelope/EnvelopeMapper');

describe('SaveEnvelopeRepository', () => {
  let repository: SaveEnvelopeRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockClient: jest.Mocked<IDatabaseClient>;
  let mockMapper: jest.Mocked<typeof EnvelopeMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      query: jest.fn().mockResolvedValue([]),
      release: jest.fn(),
    } as jest.Mocked<IDatabaseClient>;

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
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

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(false);
      expect(mockMapper.toRow).toHaveBeenCalledWith(envelope);
      expect(mockClient.query).toHaveBeenCalledWith(
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
      expect(mockClient.release).toHaveBeenCalledTimes(1);
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

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SET'),
        expect.any(Array),
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        expect.any(Array),
      );
      expect(mockClient.release).toHaveBeenCalledTimes(1);
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

      await repository.execute(envelope);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('name = $2'),
        expect.any(Array),
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('monthly_limit = $3'),
        expect.any(Array),
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('current_balance = $4'),
        expect.any(Array),
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = $5'),
        expect.any(Array),
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('updated_at = $6'),
        expect.any(Array),
      );
      expect(mockClient.release).toHaveBeenCalledTimes(1);
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
      mockClient.query.mockRejectedValue(dbError);

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(DomainError);
      expect(result.errors[0].message).toContain('Failed to save envelope');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
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
      mockClient.query.mockRejectedValue(unknownError);

      const result = await repository.execute(envelope);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(DomainError);
      expect(result.errors[0].message).toContain('Unknown error');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
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

      await repository.execute(envelope);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE envelopes'),
        expect.any(Array),
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SET'),
        expect.any(Array),
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        expect.any(Array),
      );
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeWithClient', () => {
    const createValidEnvelope = (): Envelope => {
      const result = Envelope.create({
        name: 'Test Envelope',
        monthlyLimit: 10000,
        budgetId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
      });
      return result.data!;
    };

    it('should save envelope successfully with provided client', async () => {
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

      const result = await repository.executeWithClient(mockClient, envelope);

      expect(result.hasError).toBe(false);
      expect(mockMapper.toRow).toHaveBeenCalledWith(envelope);
      expect(mockClient.query).toHaveBeenCalledWith(
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
      expect(mockClient.release).not.toHaveBeenCalled();
    });

    it('should return error when db fails with provided client', async () => {
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
      mockClient.query.mockRejectedValue(dbError);

      const result = await repository.executeWithClient(mockClient, envelope);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(DomainError);
      expect(result.errors[0].message).toContain('Failed to save envelope');
      expect(mockClient.release).not.toHaveBeenCalled();
    });

    it('should not release client when using executeWithClient', async () => {
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

      await repository.executeWithClient(mockClient, envelope);

      expect(mockClient.release).not.toHaveBeenCalled();
    });
  });
});

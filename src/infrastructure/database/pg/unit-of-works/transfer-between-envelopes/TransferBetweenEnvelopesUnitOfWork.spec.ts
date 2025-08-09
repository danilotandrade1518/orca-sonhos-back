import { Envelope } from '@domain/aggregates/envelope/envelope-entity/Envelope';
import { EnvelopeTransferExecutionError } from '@domain/aggregates/envelope/errors/EnvelopeTransferExecutionError';
import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import {
  IDatabaseClient,
  IPostgresConnectionAdapter,
} from '../../../../adapters/IPostgresConnectionAdapter';
import { SaveEnvelopeRepository } from '../../repositories/envelope/save-envelope-repository/SaveEnvelopeRepository';
import { TransferBetweenEnvelopesUnitOfWork } from './TransferBetweenEnvelopesUnitOfWork';

jest.mock(
  '../../repositories/envelope/save-envelope-repository/SaveEnvelopeRepository',
);

class MockDomainError extends DomainError {
  protected fieldName: string = 'mock';
  constructor(message: string) {
    super(message);
  }
}

describe('TransferBetweenEnvelopesUnitOfWork', () => {
  let unitOfWork: TransferBetweenEnvelopesUnitOfWork;
  let mockPostgresConnectionAdapter: jest.Mocked<IPostgresConnectionAdapter>;
  let mockClient: jest.Mocked<IDatabaseClient>;
  let mockSaveEnvelopeRepository: jest.Mocked<SaveEnvelopeRepository>;

  beforeEach(() => {
    mockClient = {
      query: jest.fn().mockResolvedValue([]),
      release: jest.fn(),
    } as jest.Mocked<IDatabaseClient>;

    mockPostgresConnectionAdapter = {
      getClient: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
    } as jest.Mocked<IPostgresConnectionAdapter>;

    mockSaveEnvelopeRepository = new SaveEnvelopeRepository(
      mockPostgresConnectionAdapter,
    ) as jest.Mocked<SaveEnvelopeRepository>;

    mockSaveEnvelopeRepository.executeWithClient = jest.fn();

    unitOfWork = new TransferBetweenEnvelopesUnitOfWork(
      mockPostgresConnectionAdapter,
    );

    // Replace the internal repository with our mock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (unitOfWork as any).saveEnvelopeRepository = mockSaveEnvelopeRepository;
  });

  const createValidEnvelope = (budgetId: string): Envelope => {
    const result = Envelope.create({
      name: 'Test Envelope',
      monthlyLimit: 10000,
      budgetId,
      categoryId: EntityId.create().value!.id,
    });
    return result.data!;
  };

  describe('executeTransfer', () => {
    it('should execute transfer successfully', async () => {
      const budgetId = EntityId.create().value!.id;
      const sourceEnvelope = createValidEnvelope(budgetId);
      const targetEnvelope = createValidEnvelope(budgetId);

      mockSaveEnvelopeRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );

      const result = await unitOfWork.executeTransfer({
        sourceEnvelope,
        targetEnvelope,
      });

      expect(result.hasError).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(
        mockSaveEnvelopeRepository.executeWithClient,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockSaveEnvelopeRepository.executeWithClient,
      ).toHaveBeenNthCalledWith(1, mockClient, sourceEnvelope);
      expect(
        mockSaveEnvelopeRepository.executeWithClient,
      ).toHaveBeenNthCalledWith(2, mockClient, targetEnvelope);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should rollback when source envelope save fails', async () => {
      const budgetId = EntityId.create().value!.id;
      const sourceEnvelope = createValidEnvelope(budgetId);
      const targetEnvelope = createValidEnvelope(budgetId);

      const mockError = new MockDomainError('Source envelope save error');
      mockSaveEnvelopeRepository.executeWithClient.mockResolvedValueOnce(
        Either.error(mockError),
      );

      const result = await unitOfWork.executeTransfer({
        sourceEnvelope,
        targetEnvelope,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeTransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Failed to save source envelope',
      );
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(
        mockSaveEnvelopeRepository.executeWithClient,
      ).toHaveBeenCalledTimes(1);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should rollback when target envelope save fails', async () => {
      const budgetId = EntityId.create().value!.id;
      const sourceEnvelope = createValidEnvelope(budgetId);
      const targetEnvelope = createValidEnvelope(budgetId);

      const mockError = new MockDomainError('Target envelope save error');
      mockSaveEnvelopeRepository.executeWithClient
        .mockResolvedValueOnce(Either.success(undefined))
        .mockResolvedValueOnce(Either.error(mockError));

      const result = await unitOfWork.executeTransfer({
        sourceEnvelope,
        targetEnvelope,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeTransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Failed to save target envelope',
      );
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(
        mockSaveEnvelopeRepository.executeWithClient,
      ).toHaveBeenCalledTimes(2);
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should handle database connection errors', async () => {
      const budgetId = EntityId.create().value!.id;
      const sourceEnvelope = createValidEnvelope(budgetId);
      const targetEnvelope = createValidEnvelope(budgetId);

      const connectionError = new Error('Connection failed');
      mockPostgresConnectionAdapter.getClient.mockRejectedValue(
        connectionError,
      );

      const result = await unitOfWork.executeTransfer({
        sourceEnvelope,
        targetEnvelope,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeTransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Unexpected error during envelope transfer execution',
      );
      expect(result.errors[0].message).toContain('Connection failed');
    });

    it('should handle transaction begin errors', async () => {
      const budgetId = EntityId.create().value!.id;
      const sourceEnvelope = createValidEnvelope(budgetId);
      const targetEnvelope = createValidEnvelope(budgetId);

      const beginError = new Error('BEGIN transaction failed');
      mockClient.query.mockRejectedValue(beginError);

      const result = await unitOfWork.executeTransfer({
        sourceEnvelope,
        targetEnvelope,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeTransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Unexpected error during envelope transfer execution',
      );
    });

    it('should handle commit errors', async () => {
      const budgetId = EntityId.create().value!.id;
      const sourceEnvelope = createValidEnvelope(budgetId);
      const targetEnvelope = createValidEnvelope(budgetId);

      mockSaveEnvelopeRepository.executeWithClient.mockResolvedValue(
        Either.success(undefined),
      );

      const commitError = new Error('COMMIT failed');
      mockClient.query
        .mockResolvedValueOnce([]) // BEGIN
        .mockRejectedValue(commitError); // COMMIT

      const result = await unitOfWork.executeTransfer({
        sourceEnvelope,
        targetEnvelope,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeTransferExecutionError);
      expect(result.errors[0].message).toContain(
        'Unexpected error during envelope transfer execution',
      );
    });

    it('should handle rollback errors gracefully', async () => {
      const budgetId = EntityId.create().value!.id;
      const sourceEnvelope = createValidEnvelope(budgetId);
      const targetEnvelope = createValidEnvelope(budgetId);

      const saveError = new MockDomainError('Save failed');
      const rollbackError = new Error('ROLLBACK failed');

      mockSaveEnvelopeRepository.executeWithClient.mockResolvedValue(
        Either.error(saveError),
      );

      mockClient.query
        .mockResolvedValueOnce([]) // BEGIN
        .mockRejectedValue(rollbackError); // ROLLBACK

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await unitOfWork.executeTransfer({
        sourceEnvelope,
        targetEnvelope,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(EnvelopeTransferExecutionError);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to rollback transaction:',
        rollbackError,
      );

      consoleErrorSpy.mockRestore();
    });

    it('should execute operations in correct order', async () => {
      const budgetId = EntityId.create().value!.id;
      const sourceEnvelope = createValidEnvelope(budgetId);
      const targetEnvelope = createValidEnvelope(budgetId);

      const executionOrder: string[] = [];

      mockClient.query.mockImplementation((sql: string) => {
        executionOrder.push(`client.query: ${sql}`);
        return Promise.resolve([]);
      });

      mockSaveEnvelopeRepository.executeWithClient.mockImplementation(
        (client, envelope) => {
          if (envelope === sourceEnvelope) {
            executionOrder.push('saveSource');
          } else {
            executionOrder.push('saveTarget');
          }
          return Promise.resolve(Either.success(undefined));
        },
      );

      mockClient.release.mockImplementation(() => {
        executionOrder.push('client.release');
      });

      const result = await unitOfWork.executeTransfer({
        sourceEnvelope,
        targetEnvelope,
      });

      expect(result.hasError).toBe(false);
      expect(executionOrder).toEqual([
        'client.query: BEGIN',
        'saveSource',
        'saveTarget',
        'client.query: COMMIT',
        'client.release',
      ]);
    });
  });
});

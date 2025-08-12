import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  CreditCardMapper,
  CreditCardRow,
} from '../../../mappers/credit-card/CreditCardMapper';
import { GetCreditCardRepository } from './GetCreditCardRepository';

jest.mock('../../../mappers/credit-card/CreditCardMapper');

class TestDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'TestDomainError';
  }
}

describe('GetCreditCardRepository', () => {
  let repository: GetCreditCardRepository;
  let mockConnectionAdapter: IPostgresConnectionAdapter;
  let mockQueryOne: jest.Mock;

  const validId = '550e8400-e29b-41d4-a716-446655440001';
  const creditCardId = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(() => {
    mockQueryOne = jest.fn();

    mockConnectionAdapter = {
      query: jest.fn(),
      queryOne: mockQueryOne,
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new GetCreditCardRepository(mockConnectionAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return credit card when found', async () => {
      const mockRow: CreditCardRow = {
        id: creditCardId,
        name: 'Cartão de Crédito Principal',
        limit: 5000.0,
        closing_day: 15,
        due_day: 10,
        budget_id: '550e8400-e29b-41d4-a716-446655440003',
        is_deleted: false,
        created_at: new Date('2024-01-15T10:00:00Z'),
        updated_at: new Date('2024-01-15T10:00:00Z'),
      };

      const mockCreditCard = {
        id: creditCardId,
        name: 'Cartão de Crédito Principal',
        limit: 5000.0,
        closingDay: 15,
        dueDay: 10,
        budgetId: '550e8400-e29b-41d4-a716-446655440003',
        isDeleted: false,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      } as CreditCard;

      mockQueryOne.mockResolvedValue(mockRow);
      jest
        .spyOn(CreditCardMapper, 'toDomain')
        .mockReturnValue(Either.success(mockCreditCard));

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toEqual(mockCreditCard);
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [validId],
      );
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND is_deleted = false'),
        [validId],
      );
    });

    it('should return null when credit card not found', async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [validId],
      );
    });

    it('should filter deleted credit cards', async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        [validId],
      );
    });

    it('should return error when database query fails', async () => {
      const databaseError = new Error('Connection timeout');
      mockQueryOne.mockRejectedValue(databaseError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Connection timeout');
    });

    it('should return error when mapping fails', async () => {
      const mockRow: CreditCardRow = {
        id: creditCardId,
        name: 'Invalid Credit Card',
        limit: -1000.0, // Invalid limit
        closing_day: 15,
        due_day: 10,
        budget_id: '550e8400-e29b-41d4-a716-446655440003',
        is_deleted: false,
        created_at: new Date('2024-01-15T10:00:00Z'),
        updated_at: new Date('2024-01-15T10:00:00Z'),
      };

      const mappingError = new TestDomainError('Invalid credit card limit');
      mockQueryOne.mockResolvedValue(mockRow);
      jest
        .spyOn(CreditCardMapper, 'toDomain')
        .mockReturnValue(
          Either.error(mappingError) as Either<DomainError, CreditCard>,
        );

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to map credit card from database',
      );
    });

    it('should handle undefined database result', async () => {
      mockQueryOne.mockResolvedValue(undefined);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should use correct SQL query structure', async () => {
      mockQueryOne.mockResolvedValue(null);

      await repository.execute(validId);

      const calledQuery = mockQueryOne.mock.calls[0][0];
      expect(calledQuery).toContain('SELECT');
      expect(calledQuery).toContain(
        'id, name, limit, closing_day, due_day, budget_id',
      );
      expect(calledQuery).toContain('is_deleted, created_at, updated_at');
      expect(calledQuery).toContain('FROM credit_cards');
      expect(calledQuery).toContain('WHERE id = $1 AND is_deleted = false');
    });

    it('should handle empty credit card ID', async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute('');

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [''],
      );
    });

    it('should handle special characters in credit card ID', async () => {
      const specialId = "'; DROP TABLE credit_cards; --";
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute(specialId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [specialId],
      );
    });

    it('should handle network timeout error', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';
      mockQueryOne.mockRejectedValue(timeoutError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Connection timeout');
    });

    it('should handle unknown database error', async () => {
      const unknownError = 'Unknown database error';
      mockQueryOne.mockRejectedValue(unknownError);

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Failed to get credit card by id',
      );
    });

    it('should call repository only once per execution', async () => {
      mockQueryOne.mockResolvedValue(null);

      await repository.execute(validId);
      await repository.execute(validId);

      expect(mockQueryOne).toHaveBeenCalledTimes(2);
    });

    it('should preserve credit card properties in mapping', async () => {
      const mockRow: CreditCardRow = {
        id: creditCardId,
        name: 'Cartão Premium',
        limit: 10000.0,
        closing_day: 20,
        due_day: 15,
        budget_id: '550e8400-e29b-41d4-a716-446655440004',
        is_deleted: false,
        created_at: new Date('2024-02-01T08:30:00Z'),
        updated_at: new Date('2024-02-15T14:45:00Z'),
      };

      const mockCreditCard = {
        id: creditCardId,
        name: 'Cartão Premium',
        limit: 10000.0,
        closingDay: 20,
        dueDay: 15,
        budgetId: '550e8400-e29b-41d4-a716-446655440004',
        isDeleted: false,
        createdAt: new Date('2024-02-01T08:30:00Z'),
        updatedAt: new Date('2024-02-15T14:45:00Z'),
      } as CreditCard;

      mockQueryOne.mockResolvedValue(mockRow);
      jest
        .spyOn(CreditCardMapper, 'toDomain')
        .mockReturnValue(Either.success(mockCreditCard));

      const result = await repository.execute(validId);

      expect(result.hasError).toBe(false);
      expect(result.data?.name).toBe('Cartão Premium');
      expect(result.data?.limit).toBe(10000.0);
      expect(result.data?.closingDay).toBe(20);
      expect(result.data?.dueDay).toBe(15);
    });
  });
});

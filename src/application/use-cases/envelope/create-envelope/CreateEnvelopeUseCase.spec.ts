import { DomainError } from '@domain/shared/DomainError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { IAddEnvelopeRepository } from '../../../contracts/repositories/envelope/IAddEnvelopeRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { BudgetNotFoundError } from '../../../shared/errors/BudgetNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { CreateEnvelopeDto } from './CreateEnvelopeDto';
import { CreateEnvelopeUseCase } from './CreateEnvelopeUseCase';

describe('CreateEnvelopeUseCase', () => {
  let useCase: CreateEnvelopeUseCase;
  let mockAddEnvelopeRepository: jest.Mocked<IAddEnvelopeRepository>;
  let mockBudgetAuthorizationService: jest.Mocked<IBudgetAuthorizationService>;

  const validDto: CreateEnvelopeDto = {
    userId: EntityId.create().value!.id,
    budgetId: EntityId.create().value!.id,
    name: 'Alimentação',
    monthlyLimit: 50000,
    categoryId: EntityId.create().value!.id,
  };

  beforeEach(() => {
    mockAddEnvelopeRepository = {
      execute: jest.fn(),
    };

    mockBudgetAuthorizationService = {
      canAccessBudget: jest.fn(),
    };

    useCase = new CreateEnvelopeUseCase(
      mockAddEnvelopeRepository,
      mockBudgetAuthorizationService,
    );
  });

  describe('execute', () => {
    it('should create envelope successfully', async () => {
      mockBudgetAuthorizationService.canAccessBudget.mockResolvedValue(
        Either.success(true),
      );
      mockAddEnvelopeRepository.execute.mockResolvedValue(
        Either.success(undefined),
      );

      const result = await useCase.execute(validDto);

      expect(result.hasError).toBe(false);
      expect(result.data).toHaveProperty('id');
      expect(
        mockBudgetAuthorizationService.canAccessBudget,
      ).toHaveBeenCalledWith(validDto.userId, validDto.budgetId);
      expect(mockAddEnvelopeRepository.execute).toHaveBeenCalledTimes(1);
    });

    it('should fail when user is not authorized', async () => {
      mockBudgetAuthorizationService.canAccessBudget.mockResolvedValue(
        Either.error(new InsufficientPermissionsError()),
      );

      const result = await useCase.execute(validDto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
      expect(mockAddEnvelopeRepository.execute).not.toHaveBeenCalled();
    });

    it('should fail when budget is not found', async () => {
      mockBudgetAuthorizationService.canAccessBudget.mockResolvedValue(
        Either.error(new BudgetNotFoundError()),
      );

      const result = await useCase.execute(validDto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(BudgetNotFoundError);
      expect(mockAddEnvelopeRepository.execute).not.toHaveBeenCalled();
    });

    it('should fail with invalid envelope data', async () => {
      mockBudgetAuthorizationService.canAccessBudget.mockResolvedValue(
        Either.success(true),
      );

      const invalidDto = {
        ...validDto,
        name: '',
      };

      const result = await useCase.execute(invalidDto);

      expect(result.hasError).toBe(true);
      expect(mockAddEnvelopeRepository.execute).not.toHaveBeenCalled();
    });

    it('should fail when repository fails', async () => {
      mockBudgetAuthorizationService.canAccessBudget.mockResolvedValue(
        Either.success(true),
      );

      class MockDomainError extends DomainError {
        constructor() {
          super('Database error');
        }
      }

      mockAddEnvelopeRepository.execute.mockResolvedValue(
        Either.error(new MockDomainError()),
      );

      const result = await useCase.execute(validDto);

      expect(result.hasError).toBe(true);
      expect(mockAddEnvelopeRepository.execute).toHaveBeenCalledTimes(1);
    });

    it('should fail with negative monthly limit', async () => {
      mockBudgetAuthorizationService.canAccessBudget.mockResolvedValue(
        Either.success(true),
      );

      const invalidDto = {
        ...validDto,
        monthlyLimit: -100,
      };

      const result = await useCase.execute(invalidDto);

      expect(result.hasError).toBe(true);
      expect(mockAddEnvelopeRepository.execute).not.toHaveBeenCalled();
    });

    it('should fail with invalid budget id', async () => {
      mockBudgetAuthorizationService.canAccessBudget.mockResolvedValue(
        Either.success(true),
      );

      const invalidDto = {
        ...validDto,
        budgetId: 'invalid-uuid',
      };

      const result = await useCase.execute(invalidDto);

      expect(result.hasError).toBe(true);
      expect(mockAddEnvelopeRepository.execute).not.toHaveBeenCalled();
    });

    it('should fail with invalid category id', async () => {
      mockBudgetAuthorizationService.canAccessBudget.mockResolvedValue(
        Either.success(true),
      );

      const invalidDto = {
        ...validDto,
        categoryId: '',
      };

      const result = await useCase.execute(invalidDto);

      expect(result.hasError).toBe(true);
      expect(mockAddEnvelopeRepository.execute).not.toHaveBeenCalled();
    });
  });
});

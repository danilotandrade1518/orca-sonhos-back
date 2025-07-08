import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { AddBudgetRepositoryStub } from '../../../shared/tests/stubs/AddBudgetRepositoryStub';
import { CreateBudgetDto } from './CreateBudgetDto';
import { CreateBudgetUseCase } from './CreateBudgetUseCase';

describe('CreateBudgetUseCase', () => {
  let useCase: CreateBudgetUseCase;
  let repositoryStub: AddBudgetRepositoryStub;

  beforeEach(() => {
    repositoryStub = new AddBudgetRepositoryStub();
    useCase = new CreateBudgetUseCase(repositoryStub);
  });

  describe('execute', () => {
    it('should create budget successfully with valid data', async () => {
      const dto: CreateBudgetDto = {
        name: 'Orçamento Familiar',
        ownerId: EntityId.create().value!.id,
        participantIds: [EntityId.create().value!.id],
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBeDefined();
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Orçamento Familiar',
        }),
      );
    });

    it('should create budget successfully without participants', async () => {
      const dto: CreateBudgetDto = {
        name: 'Orçamento Pessoal',
        ownerId: EntityId.create().value!.id,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBeDefined();
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    it('should fail when budget name is empty', async () => {
      const dto: CreateBudgetDto = {
        name: '',
        ownerId: EntityId.create().value!.id,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0].message).toContain('is invalid');
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when budget name is too short', async () => {
      const dto: CreateBudgetDto = {
        name: 'a',
        ownerId: EntityId.create().value!.id,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0].message).toContain('is invalid');
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when ownerId is empty', async () => {
      const dto: CreateBudgetDto = {
        name: 'Valid Budget Name',
        ownerId: '',
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0].message).toContain('is invalid');
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when ownerId is invalid format', async () => {
      const dto: CreateBudgetDto = {
        name: 'Valid Budget Name',
        ownerId: 'invalid-id-format-with-special-chars@#$',
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0].message).toContain('is invalid');
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when repository throws error', async () => {
      const dto: CreateBudgetDto = {
        name: 'Valid Budget Name',
        ownerId: EntityId.create().value!.id,
      };

      const repositoryError = new RepositoryError('Database connection failed');
      const failureEither = Either.error<RepositoryError, void>(
        repositoryError,
      );

      const executeSpy = jest
        .spyOn(repositoryStub, 'execute')
        .mockResolvedValue(failureEither);

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0].message).toContain('Database connection failed');
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    it('should fail when participant IDs contain invalid values', async () => {
      const dto: CreateBudgetDto = {
        name: 'Valid Budget Name',
        ownerId: EntityId.create().value!.id,
        participantIds: [
          EntityId.create().value!.id,
          '',
          EntityId.create().value!.id,
        ],
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0].message).toContain('is invalid');
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple domain validation errors', async () => {
      const dto: CreateBudgetDto = {
        name: '',
        ownerId: '',
        participantIds: [''],
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0].message).toContain('is invalid');
      expect(executeSpy).not.toHaveBeenCalled();
    });
  });
});

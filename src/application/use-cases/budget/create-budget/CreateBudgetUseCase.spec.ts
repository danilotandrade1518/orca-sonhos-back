import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { CreateBudgetDto } from './CreateBudgetDto';
import { CreateBudgetUseCase } from './CreateBudgetUseCase';
import { AddBudgetRepositoryStub } from '../../../shared/tests/stubs/AddBudgetRepositoryStub';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

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

      const response = await useCase.execute(dto);

      expect(response.success).toBe(true);
      expect(response.id).toBeDefined();
      expect(response.errors).toBeUndefined();
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

      const response = await useCase.execute(dto);

      expect(response.success).toBe(true);
      expect(response.id).toBeDefined();
      expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    it('should fail when budget name is empty', async () => {
      const dto: CreateBudgetDto = {
        name: '',
        ownerId: EntityId.create().value!.id,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const response = await useCase.execute(dto);

      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
      expect(response.errors!.length).toBeGreaterThan(0);
      expect(response.id).toBeUndefined();
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when budget name is too short', async () => {
      const dto: CreateBudgetDto = {
        name: 'a',
        ownerId: EntityId.create().value!.id,
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const response = await useCase.execute(dto);

      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
      expect(response.errors!.length).toBeGreaterThan(0);
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when ownerId is empty', async () => {
      const dto: CreateBudgetDto = {
        name: 'Valid Budget Name',
        ownerId: '',
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const response = await useCase.execute(dto);

      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
      expect(response.errors!.length).toBeGreaterThan(0);
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when ownerId is invalid format', async () => {
      const dto: CreateBudgetDto = {
        name: 'Valid Budget Name',
        ownerId: 'invalid-id-format-with-special-chars@#$',
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const response = await useCase.execute(dto);

      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
      expect(response.errors!.length).toBeGreaterThan(0);
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should fail when repository throws error', async () => {
      const dto: CreateBudgetDto = {
        name: 'Valid Budget Name',
        ownerId: EntityId.create().value!.id,
      };

      const repositoryError = new RepositoryError('Database connection failed');
      const failureEither = new Either<RepositoryError, void>();
      failureEither.addError(repositoryError);

      const executeSpy = jest
        .spyOn(repositoryStub, 'execute')
        .mockResolvedValue(failureEither);

      const response = await useCase.execute(dto);

      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
      expect(response.errors).toContain('Database connection failed');
      expect(response.id).toBeUndefined();
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

      const response = await useCase.execute(dto);

      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
      expect(response.errors!.length).toBeGreaterThan(0);
      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple domain validation errors', async () => {
      const dto: CreateBudgetDto = {
        name: '',
        ownerId: '',
        participantIds: [''],
      };

      const executeSpy = jest.spyOn(repositoryStub, 'execute');

      const response = await useCase.execute(dto);

      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
      expect(response.errors!.length).toBeGreaterThan(1);
      expect(executeSpy).not.toHaveBeenCalled();
    });
  });
});

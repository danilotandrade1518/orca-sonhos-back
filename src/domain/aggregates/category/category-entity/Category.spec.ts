import { CategoryAlreadyDeletedError } from '../errors/CategoryAlreadyDeletedError';
import { InvalidCategoryTypeError } from '../errors/InvalidCategoryTypeError';
import { CategoryCreatedEvent } from '../events/CategoryCreatedEvent';
import { CategoryDeletedEvent } from '../events/CategoryDeletedEvent';
import { CategoryUpdatedEvent } from '../events/CategoryUpdatedEvent';
import { CategoryTypeEnum } from '../value-objects/category-type/CategoryType';
import { InvalidEntityIdError } from '../../../shared/errors/InvalidEntityIdError';
import { InvalidEntityNameError } from '../../../shared/errors/InvalidEntityNameError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { Category } from './Category';

function makeCategoryDTO({
  name = 'Categoria Teste',
  type = CategoryTypeEnum.EXPENSE,
  budgetId = EntityId.create().value!.id,
} = {}) {
  return { name, type, budgetId };
}

describe('Categoria', () => {
  describe('create', () => {
    it('deve criar uma categoria válida', () => {
      const data = makeCategoryDTO();

      const result = Category.create(data);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeInstanceOf(Category);
      expect(result.data?.id).not.toBeNull();
      expect(result.data?.name).toBe(data.name);
      expect(result.data?.type).toBe(data.type);
      expect(result.data?.budgetId).toBe(data.budgetId);
    });

    it('deve retornar erro se name não for informado', () => {
      const result = Category.create(makeCategoryDTO({ name: '' }));

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
    });

    it('deve retornar erro se type não for informado', () => {
      const result = Category.create(
        makeCategoryDTO({ type: '' as CategoryTypeEnum }),
      );

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidCategoryTypeError());
    });

    it('deve retornar erro se budgetId não for informado', () => {
      const result = Category.create(makeCategoryDTO({ budgetId: '' }));

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityIdError(''));
    });

    it('deve acumular múltiplos erros se mais de um campo não for informado', () => {
      const result = Category.create(
        makeCategoryDTO({
          name: '',
          type: '' as CategoryTypeEnum,
          budgetId: '',
        }),
      );

      expect(result.hasError).toBe(true);
      expect(result.errors).toEqual([
        new InvalidEntityNameError(''),
        new InvalidCategoryTypeError(),
        new InvalidEntityIdError(''),
      ]);
    });

    it('deve emitir CategoryCreatedEvent ao criar', () => {
      const result = Category.create(makeCategoryDTO());
      const events = result.data!.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(CategoryCreatedEvent);
    });
  });

  describe('update', () => {
    it('deve atualizar e emitir evento', () => {
      const category = Category.create(makeCategoryDTO()).data!;
      category.clearEvents();

      const result = category.update({
        name: 'Novo',
        type: CategoryTypeEnum.INCOME,
      });

      expect(result.hasError).toBe(false);
      expect(category.name).toBe('Novo');
      expect(category.type).toBe(CategoryTypeEnum.INCOME);
      expect(category.getEvents()[0]).toBeInstanceOf(CategoryUpdatedEvent);
    });

    it('não deve emitir evento se nada alterar', () => {
      const dto = makeCategoryDTO();
      const category = Category.create(dto).data!;
      category.clearEvents();

      const result = category.update({ name: dto.name, type: dto.type });
      expect(result.hasError).toBe(false);
      expect(category.getEvents()).toHaveLength(0);
    });

    it('deve retornar erro ao atualizar categoria deletada', () => {
      const category = Category.create(makeCategoryDTO()).data!;
      category.delete();

      const result = category.update({
        name: 'A',
        type: CategoryTypeEnum.INCOME,
      });
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CategoryAlreadyDeletedError);
    });
  });

  describe('delete', () => {
    it('deve deletar e emitir evento', () => {
      const category = Category.create(makeCategoryDTO()).data!;
      category.clearEvents();

      const result = category.delete();

      expect(result.hasError).toBe(false);
      expect(category.isDeleted).toBe(true);
      expect(category.getEvents()[0]).toBeInstanceOf(CategoryDeletedEvent);
    });

    it('deve retornar erro se deletar novamente', () => {
      const category = Category.create(makeCategoryDTO()).data!;
      category.delete();

      const result = category.delete();
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CategoryAlreadyDeletedError);
    });
  });

  describe('restore', () => {
    it('deve restaurar categoria', () => {
      const dto = makeCategoryDTO();
      const created = Category.create(dto).data!;
      const data = {
        id: created.id,
        name: created.name,
        type: created.type!,
        budgetId: created.budgetId,
        isDeleted: false,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };

      const result = Category.restore(data);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(created.id);
      expect(result.data!.getEvents()).toHaveLength(0);
    });
  });

  describe('getters', () => {
    it('deve expor propriedades', () => {
      const dto = makeCategoryDTO();
      const category = Category.create(dto).data!;

      expect(category.id).toBeDefined();
      expect(category.name).toBe(dto.name);
      expect(category.type).toBe(dto.type);
      expect(category.budgetId).toBe(dto.budgetId);
      expect(category.createdAt).toBeInstanceOf(Date);
      expect(category.updatedAt).toBeInstanceOf(Date);
      expect(category.isDeleted).toBe(false);
    });
  });
});

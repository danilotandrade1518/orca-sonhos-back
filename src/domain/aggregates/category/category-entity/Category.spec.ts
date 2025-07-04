import { InvalidCategoryTypeError } from '../errors/InvalidCategoryTypeError';
import { CategoryTypeEnum } from '../value-objects/category-type/CategoryType';
import { InvalidEntityIdError } from './../../../shared/errors/InvalidEntityIdError';
import { InvalidEntityNameError } from './../../../shared/errors/InvalidEntityNameError';
import { EntityId } from './../../../shared/value-objects/entity-id/EntityId';
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
  });
});

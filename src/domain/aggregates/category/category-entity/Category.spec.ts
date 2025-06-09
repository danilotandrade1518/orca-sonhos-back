import { InvalidCategoryTypeError } from '../errors/InvalidCategoryTypeError';
import { CategoryTypeEnum } from '../value-objects/category-type/CategoryType';
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
      expect(
        result.errors.some((e) => e instanceof InvalidEntityNameError),
      ).toBe(true);
    });

    it('deve retornar erro se type não for informado', () => {
      const result = Category.create(
        makeCategoryDTO({ type: '' as CategoryTypeEnum }),
      );
      expect(result.hasError).toBe(true);
      expect(
        result.errors.some(
          (e: unknown) => e instanceof InvalidCategoryTypeError,
        ),
      ).toBe(true);
    });

    it('deve retornar erro se budgetId não for informado', () => {
      const result = Category.create(makeCategoryDTO({ budgetId: '' }));
      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
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
      expect(
        result.errors.some((e: unknown) => e instanceof InvalidEntityNameError),
      ).toBe(true);
      expect(
        result.errors.some(
          (e: unknown) => e instanceof InvalidCategoryTypeError,
        ),
      ).toBe(true);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

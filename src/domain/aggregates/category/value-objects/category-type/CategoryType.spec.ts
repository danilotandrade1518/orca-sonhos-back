import { InvalidCategoryTypeError } from '../../errors/InvalidCategoryTypeError';
import { CategoryType, CategoryTypeEnum } from './CategoryType';

describe('Tipo de Categoria', () => {
  describe('create', () => {
    it('deve criar um tipo válido - INCOME', () => {
      const result = CategoryType.create(CategoryTypeEnum.INCOME);

      expect(result.hasError).toBe(false);
      expect(result.value?.type).toBe(CategoryTypeEnum.INCOME);
    });

    it('deve criar um tipo válido - EXPENSE', () => {
      const result = CategoryType.create(CategoryTypeEnum.EXPENSE);
      expect(result.hasError).toBe(false);
      expect(result.value?.type).toBe(CategoryTypeEnum.EXPENSE);
    });

    it('deve criar um tipo válido - TRANSFER', () => {
      const result = CategoryType.create(CategoryTypeEnum.TRANSFER);
      expect(result.hasError).toBe(false);
      expect(result.value?.type).toBe(CategoryTypeEnum.TRANSFER);
    });

    it('deve retornar erro se type não for informado', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = CategoryType.create(null as any);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidCategoryTypeError());
    });
  });

  describe('equals', () => {
    it('deve retornar true para tipos iguais', () => {
      const type1 = CategoryType.create(CategoryTypeEnum.INCOME);
      const type2 = CategoryType.create(CategoryTypeEnum.INCOME);

      expect(type1.equals(type2)).toBe(true);
    });

    it('deve retornar false para tipos diferentes', () => {
      const type1 = CategoryType.create(CategoryTypeEnum.INCOME);
      const type2 = CategoryType.create(CategoryTypeEnum.EXPENSE);

      expect(type1.equals(type2)).toBe(false);
    });
  });
});

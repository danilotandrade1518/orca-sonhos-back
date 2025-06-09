import { InvalidCategoryTypeError } from '../../errors/InvalidCategoryTypeError';
import { CategoryType, CategoryTypeEnum } from './CategoryType';

describe('Tipo de Categoria', () => {
  describe('create', () => {
    it('deve criar um tipo válido - INCOME', () => {
      const result = CategoryType.create('INCOME');
      expect(result.hasError).toBe(false);
      expect(result.value?.type).toBe(CategoryTypeEnum.INCOME);
    });

    it('deve criar um tipo válido - EXPENSE', () => {
      const result = CategoryType.create('EXPENSE');
      expect(result.hasError).toBe(false);
      expect(result.value?.type).toBe(CategoryTypeEnum.EXPENSE);
    });

    it('deve criar um tipo válido - TRANSFER', () => {
      const result = CategoryType.create('TRANSFER');
      expect(result.hasError).toBe(false);
      expect(result.value?.type).toBe(CategoryTypeEnum.TRANSFER);
    });

    it('deve ser case insensitive', () => {
      const result = CategoryType.create('income');
      expect(result.hasError).toBe(false);
      expect(result.value?.type).toBe(CategoryTypeEnum.INCOME);
    });

    it('deve retornar erro se type não for informado', () => {
      const result = CategoryType.create('');
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidCategoryTypeError);
      expect(result.errors[0].message).toBe('CategoryType is invalid');
    });

    it('deve retornar erro se type for inválido', () => {
      const result = CategoryType.create('INVALID');
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidCategoryTypeError);
      expect(result.errors[0].message).toBe('CategoryType is invalid');
    });
  });

  describe('equals', () => {
    it('deve retornar true para tipos iguais', () => {
      const type1 = CategoryType.create('INCOME');
      const type2 = CategoryType.create('INCOME');
      expect(type1.equals(type2)).toBe(true);
    });

    it('deve retornar false para tipos diferentes', () => {
      const type1 = CategoryType.create('INCOME');
      const type2 = CategoryType.create('EXPENSE');
      expect(type1.equals(type2)).toBe(false);
    });
  });
});

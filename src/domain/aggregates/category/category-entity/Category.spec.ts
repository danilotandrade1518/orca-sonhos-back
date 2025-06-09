import { InvalidCategoryTypeError } from '../errors/InvalidCategoryTypeError';
import { CategoryTypeEnum } from '../value-objects/category-type/CategoryType';
import { InvalidEntityNameError } from './../../../shared/errors/InvalidEntityNameError';
import { Category } from './Category';

describe('Categoria', () => {
  const validName = 'Categoria Teste';
  const validType = CategoryTypeEnum.EXPENSE;

  describe('create', () => {
    it('deve criar uma categoria válida', () => {
      const result = Category.create({
        name: validName,
        type: validType,
      });

      expect(result.hasError).toBe(false);
      expect(result.data).toBeInstanceOf(Category);
      expect(result.data?.id).not.toBeNull();
      expect(result.data?.name).toBe(validName);
      expect(result.data?.type).toBe(validType);
    });

    it('deve retornar erro se name não for informado', () => {
      const result = Category.create({
        name: '',
        type: validType,
      });
      expect(result.hasError).toBe(true);
      expect(
        result.errors.some((e) => e instanceof InvalidEntityNameError),
      ).toBe(true);
    });

    it('deve retornar erro se type não for informado', () => {
      const result = Category.create({
        name: validName,
        type: '' as CategoryTypeEnum,
      });
      expect(result.hasError).toBe(true);
      expect(
        result.errors.some((e) => e instanceof InvalidCategoryTypeError),
      ).toBe(true);
    });

    it('deve acumular múltiplos erros se mais de um campo não for informado', () => {
      const result = Category.create({
        name: '',
        type: '' as CategoryTypeEnum,
      });
      expect(result.hasError).toBe(true);
      expect(
        result.errors.some((e) => e instanceof InvalidEntityNameError),
      ).toBe(true);
      expect(
        result.errors.some((e) => e instanceof InvalidCategoryTypeError),
      ).toBe(true);
    });
  });
});

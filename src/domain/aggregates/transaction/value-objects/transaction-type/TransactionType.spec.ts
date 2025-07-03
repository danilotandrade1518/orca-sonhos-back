import { InvalidTransactionTypeError } from '../../errors/InvalidTransactionTypeError';
import { TransactionType, TransactionTypeEnum } from './TransactionType';

describe('TransactionType', () => {
  describe('create', () => {
    it('deve criar um tipo válido - INCOME', () => {
      const result = TransactionType.create(TransactionTypeEnum.INCOME);

      expect(result.hasError).toBe(false);
      expect(result.value?.type).toBe(TransactionTypeEnum.INCOME);
    });

    it('deve criar um tipo válido - EXPENSE', () => {
      const result = TransactionType.create(TransactionTypeEnum.EXPENSE);
      expect(result.hasError).toBe(false);
      expect(result.value?.type).toBe(TransactionTypeEnum.EXPENSE);
    });

    it('deve criar um tipo válido - TRANSFER', () => {
      const result = TransactionType.create(TransactionTypeEnum.TRANSFER);
      expect(result.hasError).toBe(false);
      expect(result.value?.type).toBe(TransactionTypeEnum.TRANSFER);
    });

    it('deve retornar erro se type não for informado', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = TransactionType.create(null as any);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidTransactionTypeError());
    });

    it('deve retornar erro se type for inválido', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = TransactionType.create('INVALID' as any);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidTransactionTypeError());
    });
  });

  describe('equals', () => {
    it('deve retornar true para tipos iguais', () => {
      const type1 = TransactionType.create(TransactionTypeEnum.INCOME);
      const type2 = TransactionType.create(TransactionTypeEnum.INCOME);

      expect(type1.equals(type2)).toBe(true);
    });

    it('deve retornar false para tipos diferentes', () => {
      const type1 = TransactionType.create(TransactionTypeEnum.INCOME);
      const type2 = TransactionType.create(TransactionTypeEnum.EXPENSE);

      expect(type1.equals(type2)).toBe(false);
    });
  });
});

import { InvalidTransactionStatusError } from '../../errors/InvalidTransactionStatusError';
import { TransactionStatus, TransactionStatusEnum } from './TransactionStatus';

describe('TransactionStatus', () => {
  describe('create', () => {
    it('deve criar um status válido - SCHEDULED', () => {
      const result = TransactionStatus.create(TransactionStatusEnum.SCHEDULED);

      expect(result.hasError).toBe(false);
      expect(result.value?.status).toBe(TransactionStatusEnum.SCHEDULED);
    });

    it('deve criar um status válido - COMPLETED', () => {
      const result = TransactionStatus.create(TransactionStatusEnum.COMPLETED);
      expect(result.hasError).toBe(false);
      expect(result.value?.status).toBe(TransactionStatusEnum.COMPLETED);
    });

    it('deve criar um status válido - OVERDUE', () => {
      const result = TransactionStatus.create(TransactionStatusEnum.OVERDUE);
      expect(result.hasError).toBe(false);
      expect(result.value?.status).toBe(TransactionStatusEnum.OVERDUE);
    });

    it('deve criar um status válido - CANCELLED', () => {
      const result = TransactionStatus.create(TransactionStatusEnum.CANCELLED);
      expect(result.hasError).toBe(false);
      expect(result.value?.status).toBe(TransactionStatusEnum.CANCELLED);
    });

    it('deve retornar erro se status não for informado', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = TransactionStatus.create(null as any);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidTransactionStatusError());
    });

    it('deve retornar erro se status for inválido', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = TransactionStatus.create('INVALID' as any);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidTransactionStatusError());
    });
  });

  describe('equals', () => {
    it('deve retornar true para status iguais', () => {
      const status1 = TransactionStatus.create(TransactionStatusEnum.SCHEDULED);
      const status2 = TransactionStatus.create(TransactionStatusEnum.SCHEDULED);

      expect(status1.equals(status2)).toBe(true);
    });

    it('deve retornar false para status diferentes', () => {
      const status1 = TransactionStatus.create(TransactionStatusEnum.SCHEDULED);
      const status2 = TransactionStatus.create(TransactionStatusEnum.COMPLETED);

      expect(status1.equals(status2)).toBe(false);
    });
  });
});

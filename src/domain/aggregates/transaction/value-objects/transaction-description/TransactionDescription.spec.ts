import { InvalidTransactionDescriptionError } from '../../errors/InvalidTransactionDescriptionError';
import { TransactionDescription } from './TransactionDescription';

describe('TransactionDescription', () => {
  describe('create', () => {
    it('deve criar uma descrição válida', () => {
      const result = TransactionDescription.create('Supermercado ABC');

      expect(result.hasError).toBe(false);
      expect(result.value?.description).toBe('Supermercado ABC');
    });

    it('deve criar uma descrição válida removendo espaços extras', () => {
      const result = TransactionDescription.create('  Padaria XYZ  ');

      expect(result.hasError).toBe(false);
      expect(result.value?.description).toBe('Padaria XYZ');
    });

    it('deve aceitar descrição com 3 caracteres', () => {
      const result = TransactionDescription.create('ABC');

      expect(result.hasError).toBe(false);
      expect(result.value?.description).toBe('ABC');
    });

    it('deve aceitar descrição com 100 caracteres', () => {
      const longDescription = 'A'.repeat(100);
      const result = TransactionDescription.create(longDescription);

      expect(result.hasError).toBe(false);
      expect(result.value?.description).toBe(longDescription);
    });

    it('deve retornar erro se descrição for vazia', () => {
      const result = TransactionDescription.create('');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(
        new InvalidTransactionDescriptionError(),
      );
    });

    it('deve retornar erro se descrição for apenas espaços', () => {
      const result = TransactionDescription.create('   ');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(
        new InvalidTransactionDescriptionError(),
      );
    });

    it('deve retornar erro se descrição for muito curta', () => {
      const result = TransactionDescription.create('AB');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(
        new InvalidTransactionDescriptionError(),
      );
    });

    it('deve retornar erro se descrição for muito longa', () => {
      const longDescription = 'A'.repeat(101);
      const result = TransactionDescription.create(longDescription);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(
        new InvalidTransactionDescriptionError(),
      );
    });

    it('deve retornar erro se descrição for null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = TransactionDescription.create(null as any);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(
        new InvalidTransactionDescriptionError(),
      );
    });
  });

  describe('equals', () => {
    it('deve retornar true para descrições iguais', () => {
      const desc1 = TransactionDescription.create('Supermercado ABC');
      const desc2 = TransactionDescription.create('Supermercado ABC');

      expect(desc1.equals(desc2)).toBe(true);
    });

    it('deve retornar false para descrições diferentes', () => {
      const desc1 = TransactionDescription.create('Supermercado ABC');
      const desc2 = TransactionDescription.create('Padaria XYZ');

      expect(desc1.equals(desc2)).toBe(false);
    });
  });
});

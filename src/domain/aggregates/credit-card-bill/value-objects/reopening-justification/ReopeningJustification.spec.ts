import { InvalidReopeningJustificationError } from '../../errors/InvalidReopeningJustificationError';
import { ReopeningJustification } from './ReopeningJustification';

describe('ReopeningJustification', () => {
  describe('create', () => {
    it('deve criar justificativa válida', () => {
      const result = ReopeningJustification.create('Justificativa válida');

      expect(result.hasError).toBe(false);
      expect(result.value?.justification).toBe('Justificativa válida');
    });

    it('deve remover espaços extras', () => {
      const result = ReopeningJustification.create('  justificativa com espaços  ');

      expect(result.hasError).toBe(false);
      expect(result.value?.justification).toBe('justificativa com espaços');
    });

    it('deve retornar erro se justificativa for curta', () => {
      const result = ReopeningJustification.create('curta');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidReopeningJustificationError());
    });

    it('deve retornar erro se justificativa for longa', () => {
      const long = 'a'.repeat(501);
      const result = ReopeningJustification.create(long);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidReopeningJustificationError());
    });

    it('deve retornar erro se justificativa for vazia', () => {
      const result = ReopeningJustification.create('   ');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidReopeningJustificationError());
    });
  });

  describe('equals', () => {
    it('deve retornar true para justificativas iguais', () => {
      const j1 = ReopeningJustification.create('Justificativa válida');
      const j2 = ReopeningJustification.create('Justificativa válida');

      expect(j1.equals(j2)).toBe(true);
    });

    it('deve retornar false para justificativas diferentes', () => {
      const j1 = ReopeningJustification.create('Justificativa 1');
      const j2 = ReopeningJustification.create('Justificativa 2');

      expect(j1.equals(j2)).toBe(false);
    });
  });
});

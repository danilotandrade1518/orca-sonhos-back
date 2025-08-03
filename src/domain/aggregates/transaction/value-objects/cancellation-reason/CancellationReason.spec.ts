import { InvalidCancellationReasonError } from '../../errors/InvalidCancellationReasonError';
import { CancellationReason } from './CancellationReason';

describe('CancellationReason', () => {
  describe('create', () => {
    it('deve criar um motivo válido', () => {
      const vo = CancellationReason.create('Motivo válido');

      expect(vo.hasError).toBe(false);
      expect(vo.value?.reason).toBe('Motivo válido');
    });

    it('deve remover espaços extras', () => {
      const vo = CancellationReason.create('  Teste  ');

      expect(vo.hasError).toBe(false);
      expect(vo.value?.reason).toBe('Teste');
    });

    it('deve falhar se motivo for muito curto', () => {
      const vo = CancellationReason.create('ab');

      expect(vo.hasError).toBe(true);
      expect(vo.errors[0]).toEqual(new InvalidCancellationReasonError());
    });

    it('deve falhar se motivo for vazio', () => {
      const vo = CancellationReason.create('   ');

      expect(vo.hasError).toBe(true);
      expect(vo.errors[0]).toEqual(new InvalidCancellationReasonError());
    });
  });
});

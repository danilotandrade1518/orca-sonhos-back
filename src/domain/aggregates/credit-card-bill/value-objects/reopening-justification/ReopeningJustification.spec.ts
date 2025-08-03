import { InvalidReopeningJustificationError } from '../../errors/InvalidReopeningJustificationError';
import { ReopeningJustification } from './ReopeningJustification';

describe('ReopeningJustification', () => {
  it('deve criar uma justificativa válida', () => {
    const vo = ReopeningJustification.create('Pagamento efetuado incorretamente');
    expect(vo.hasError).toBe(false);
    expect(vo.value?.justification).toBe('Pagamento efetuado incorretamente');
  });

  it('deve retornar erro se justificativa for curta', () => {
    const vo = ReopeningJustification.create('curto');
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidReopeningJustificationError());
  });

  it('deve retornar erro se justificativa for longa', () => {
    const long = 'a'.repeat(501);
    const vo = ReopeningJustification.create(long);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidReopeningJustificationError());
  });

  it('deve considerar iguais justificativas com o mesmo texto', () => {
    const vo1 = ReopeningJustification.create('Texto valido de justificativa');
    const vo2 = ReopeningJustification.create('Texto valido de justificativa');
    expect(vo1.equals(vo2)).toBe(true);
  });
});

import { InvalidMoneyError } from '../../errors/InvalidMoneyError';
import { MoneyVo } from './MoneyVo';

describe('MoneyVo', () => {
  it('deve criar um valor monetário válido', () => {
    const vo = MoneyVo.create(100);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.amount).toBe(100);
  });

  it('deve retornar erro se valor não for número', () => {
    // @ts-expect-error testando valor inválido
    const vo = MoneyVo.create('abc');
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toBeInstanceOf(InvalidMoneyError);
    expect(vo.errors[0].message).toBe('Valor deve ser um número válido');
  });

  it('deve retornar erro se valor for NaN', () => {
    const vo = MoneyVo.create(NaN);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toBeInstanceOf(InvalidMoneyError);
    expect(vo.errors[0].message).toBe('Valor deve ser um número válido');
  });

  it('deve retornar erro se valor for infinito', () => {
    const vo = MoneyVo.create(Infinity);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toBeInstanceOf(InvalidMoneyError);
    expect(vo.errors[0].message).toBe('Valor deve ser finito');
  });

  it('deve retornar erro se valor for negativo', () => {
    const vo = MoneyVo.create(-10);
    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toBeInstanceOf(InvalidMoneyError);
    expect(vo.errors[0].message).toBe('Valor não pode ser negativo');
  });

  it('deve considerar iguais valores monetários com o mesmo valor', () => {
    const vo1 = MoneyVo.create(50);
    const vo2 = MoneyVo.create(50);
    expect(vo1.equals(vo2)).toBe(true);
  });

  it('deve considerar diferentes valores monetários com valores diferentes', () => {
    const vo1 = MoneyVo.create(50);
    const vo2 = MoneyVo.create(100);
    expect(vo1.equals(vo2)).toBe(false);
  });
});

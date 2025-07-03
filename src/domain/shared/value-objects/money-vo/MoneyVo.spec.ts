import { InvalidMoneyError } from '../../errors/InvalidMoneyError';
import { MoneyVo } from './MoneyVo';

describe('MoneyVo', () => {
  it('deve criar um valor monetário válido', () => {
    const vo = MoneyVo.create(100);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.cents).toBe(100);
  });

  it('deve retornar erro se valor não for número', () => {
    // @ts-expect-error testando valor inválido
    const vo = MoneyVo.create('abc');

    expect(vo.hasError).toBe(true);
    // @ts-expect-error testando valor inválido
    expect(vo.errors[0]).toEqual(new InvalidMoneyError('abc'));
  });

  it('deve retornar erro se valor for NaN', () => {
    const vo = MoneyVo.create(NaN);

    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidMoneyError(NaN));
  });

  it('deve retornar erro se valor for infinito', () => {
    const vo = MoneyVo.create(Infinity);

    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidMoneyError(Infinity));
  });

  it('deve retornar erro se valor for negativo', () => {
    const vo = MoneyVo.create(-10);

    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidMoneyError(-10));
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

  it('deve retornar o valor monetário corretamente', () => {
    const vo = MoneyVo.create(250);
    expect(vo.asMonetaryValue).toBe(2.5);
  });
});

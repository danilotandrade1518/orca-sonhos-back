import { InvalidCreditCardDayError } from '../../errors/InvalidCreditCardDayError';
import { CreditCardDayVo } from './CreditCardDayVo';

describe('CreditCardDayVo', () => {
  it('deve criar um VO válido para dias entre 1 e 31', () => {
    for (let day = 1; day <= 31; day++) {
      const vo = CreditCardDayVo.create(day);

      expect(vo.hasError).toBe(false);
      expect(vo.value?.day).toBe(day);
    }
  });

  it('deve retornar erro para dia menor que 1', () => {
    const vo = CreditCardDayVo.create(0);

    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidCreditCardDayError());
  });

  it('deve retornar erro para dia maior que 31', () => {
    const vo = CreditCardDayVo.create(32);

    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidCreditCardDayError());
  });

  it('deve retornar erro para valor não inteiro', () => {
    const vo = CreditCardDayVo.create(10.5);

    expect(vo.hasError).toBe(true);
    expect(vo.errors[0]).toEqual(new InvalidCreditCardDayError());
  });

  it('deve comparar igualdade corretamente', () => {
    const vo1 = CreditCardDayVo.create(15);
    const vo2 = CreditCardDayVo.create(15);
    const vo3 = CreditCardDayVo.create(20);

    expect(vo1.equals(vo2)).toBe(true);
    expect(vo1.equals(vo3)).toBe(false);
  });
});

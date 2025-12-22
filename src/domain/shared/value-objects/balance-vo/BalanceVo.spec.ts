import { BalanceVo } from './BalanceVo';

describe('BalanceVo', () => {
  describe('create', () => {
    it('should create a valid positive balance', () => {
      const balance = BalanceVo.create(100);

      expect(balance.hasError).toBe(false);
      expect(balance.value?.cents).toBe(100);
      expect(balance.asMonetaryValue).toBe(1);
    });

    it('should create a valid negative balance', () => {
      const balance = BalanceVo.create(-500);

      expect(balance.hasError).toBe(false);
      expect(balance.value?.cents).toBe(-500);
      expect(balance.asMonetaryValue).toBe(-5);
    });

    it('should create balance with zero value', () => {
      const balance = BalanceVo.create(0);

      expect(balance.hasError).toBe(false);
      expect(balance.value?.cents).toBe(0);
      expect(balance.asMonetaryValue).toBe(0);
    });

    it('should have error for invalid string input', () => {
      const balance = BalanceVo.create('abc' as unknown as number);

      expect(balance.hasError).toBe(true);
      expect(balance.errors).toHaveLength(1);
      expect(balance.errors[0].message).toContain(
        'O valor do saldo informado é inválido',
      );
    });

    it('should have error for NaN', () => {
      const balance = BalanceVo.create(NaN);

      expect(balance.hasError).toBe(true);
      expect(balance.errors).toHaveLength(1);
      expect(balance.errors[0].message).toContain(
        'O valor do saldo informado é inválido',
      );
    });

    it('should have error for Infinity', () => {
      const balance = BalanceVo.create(Infinity);

      expect(balance.hasError).toBe(true);
      expect(balance.errors).toHaveLength(1);
      expect(balance.errors[0].message).toContain(
        'O valor do saldo informado é inválido',
      );
    });

    it('should have error for negative Infinity', () => {
      const balance = BalanceVo.create(-Infinity);

      expect(balance.hasError).toBe(true);
      expect(balance.errors).toHaveLength(1);
      expect(balance.errors[0].message).toContain(
        'O valor do saldo informado é inválido',
      );
    });
  });

  describe('equals', () => {
    it('should return true for equal positive balances', () => {
      const balance1 = BalanceVo.create(50);
      const balance2 = BalanceVo.create(50);

      expect(balance1.equals(balance2)).toBe(true);
    });

    it('should return true for equal negative balances', () => {
      const balance1 = BalanceVo.create(-200);
      const balance2 = BalanceVo.create(-200);

      expect(balance1.equals(balance2)).toBe(true);
    });

    it('should return false for different balances', () => {
      const balance1 = BalanceVo.create(50);
      const balance2 = BalanceVo.create(-50);

      expect(balance1.equals(balance2)).toBe(false);
    });

    it('should return false when comparing with invalid balance', () => {
      const validBalance = BalanceVo.create(100);
      const invalidBalance = BalanceVo.create(NaN);

      expect(validBalance.equals(invalidBalance)).toBe(false);
    });
  });

  describe('asMonetaryValue', () => {
    it('should convert cents to monetary value correctly for positive amounts', () => {
      const balance = BalanceVo.create(250);

      expect(balance.asMonetaryValue).toBe(2.5);
    });

    it('should convert cents to monetary value correctly for negative amounts', () => {
      const balance = BalanceVo.create(-750);

      expect(balance.asMonetaryValue).toBe(-7.5);
    });

    it('should return 0 for zero balance', () => {
      const balance = BalanceVo.create(0);

      expect(balance.asMonetaryValue).toBe(0);
    });

    it('should return 0 for invalid balance', () => {
      const balance = BalanceVo.create(NaN);

      expect(balance.asMonetaryValue).toBe(0);
    });
  });

  describe('practical scenarios', () => {
    it('should handle bank account with positive balance', () => {
      const balance = BalanceVo.create(150000);

      expect(balance.hasError).toBe(false);
      expect(balance.asMonetaryValue).toBe(1500);
    });

    it('should handle bank account with negative balance (overdraft)', () => {
      const balance = BalanceVo.create(-5000);

      expect(balance.hasError).toBe(false);
      expect(balance.asMonetaryValue).toBe(-50);
    });

    it('should handle credit card balance (usually negative)', () => {
      const balance = BalanceVo.create(-25000);

      expect(balance.hasError).toBe(false);
      expect(balance.asMonetaryValue).toBe(-250);
    });
  });
});

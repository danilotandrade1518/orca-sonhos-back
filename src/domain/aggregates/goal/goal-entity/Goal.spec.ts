import { InvalidEntityNameError } from '../../../shared/errors/InvalidEntityNameError';
import { InvalidMoneyError } from '../../../shared/errors/InvalidMoneyError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { Goal } from './Goal';

describe('Goal', () => {
  const validName = 'Minha Meta';
  const validTotal = 1000;
  const validBudgetId = EntityId.create().value?.id ?? 'budget-uuid-123';
  const validDeadline = new Date('2025-12-31');

  function makeDTO(overrides = {}) {
    return {
      name: validName,
      totalAmount: validTotal,
      budgetId: validBudgetId,
      deadline: validDeadline,
      ...overrides,
    };
  }

  describe('create', () => {
    it('deve criar uma meta válida', () => {
      const result = Goal.create(makeDTO());
      expect(result.hasError).toBe(false);
      expect(result.data?.name).toBe(validName);
      expect(result.data?.totalAmount).toBe(validTotal);
      expect(result.data?.budgetId).toBe(validBudgetId);
      expect(result.data?.deadline).toEqual(validDeadline);
      expect(result.data?.accumulatedAmount).toBe(0);
    });

    it('deve retornar erro se nome for inválido', () => {
      const result = Goal.create(makeDTO({ name: '' }));
      expect(result.hasError).toBe(true);
      expect(
        result.errors.some((e) => e instanceof InvalidEntityNameError),
      ).toBe(true);
    });

    it('deve retornar erro se valor total for negativo', () => {
      const result = Goal.create(makeDTO({ totalAmount: -100 }));
      expect(result.hasError).toBe(true);
      expect(result.errors.some((e) => e instanceof InvalidMoneyError)).toBe(
        true,
      );
    });

    it('deve retornar erro se valor acumulado for negativo', () => {
      const result = Goal.create(makeDTO({ accumulatedAmount: -10 }));
      expect(result.hasError).toBe(true);
      expect(result.errors.some((e) => e instanceof InvalidMoneyError)).toBe(
        true,
      );
    });

    it('deve retornar erro se budgetId for inválido', () => {
      const result = Goal.create(makeDTO({ budgetId: '' }));
      expect(result.hasError).toBe(true);
    });

    it('deve acumular múltiplos erros se vários campos forem inválidos', () => {
      const result = Goal.create(
        makeDTO({
          name: '',
          totalAmount: -1,
          accumulatedAmount: -1,
          budgetId: '',
        }),
      );
      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('addAmount', () => {
    it('deve adicionar aporte válido', () => {
      const goal = Goal.create(makeDTO()).data!;
      const result = goal.addAmount(200);
      expect(result.hasError).toBe(false);
      expect(goal.accumulatedAmount).toBe(200);
    });

    it('deve retornar erro se aporte for negativo', () => {
      const goal = Goal.create(makeDTO()).data!;
      const result = goal.addAmount(-50);
      expect(result.hasError).toBe(true);
      expect(result.errors.some((e) => e instanceof InvalidMoneyError)).toBe(
        true,
      );
    });

    it('deve acumular corretamente múltiplos aportes', () => {
      const goal = Goal.create(makeDTO()).data!;
      goal.addAmount(100);
      goal.addAmount(200);
      expect(goal.accumulatedAmount).toBe(300);
    });
  });
});

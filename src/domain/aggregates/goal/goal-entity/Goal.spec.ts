import { InvalidEntityIdError } from '../../../shared/errors/InvalidEntityIdError';
import { InvalidEntityNameError } from '../../../shared/errors/InvalidEntityNameError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { GoalAlreadyDeletedError } from '../errors/GoalAlreadyDeletedError';
import { InvalidGoalAmountError } from '../errors/InvalidGoalAmountError';
import { Goal } from './Goal';

const validName = 'Minha Meta';
const validTotal = 1000;
const validBudgetId = EntityId.create().value!.id;
const validSourceAccountId = EntityId.create().value!.id;
const validDeadline = new Date('2025-12-31');

function makeDTO(overrides = {}) {
  return {
    name: validName,
    totalAmount: validTotal,
    budgetId: validBudgetId,
    sourceAccountId: validSourceAccountId,
    deadline: validDeadline,
    ...overrides,
  };
}

describe('Goal', () => {
  describe('create', () => {
    it('deve criar uma meta válida', () => {
      const result = Goal.create(makeDTO());

      expect(result.hasError).toBe(false);
      const goal = result.data!;
      expect(goal.name).toBe(validName);
    });

    it('deve retornar erro se nome for inválido', () => {
      const result = Goal.create(makeDTO({ name: '' }));

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityNameError(''));
    });

    it('deve retornar erro se budgetId for inválido', () => {
      const result = Goal.create(makeDTO({ budgetId: '' }));

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidEntityIdError(''));
    });
  });

  describe('addAmount', () => {
    it('deve adicionar aporte válido', () => {
      const goal = Goal.create(makeDTO()).data!;
      const result = goal.addAmount(200);

      expect(result.hasError).toBe(false);
      expect(goal.accumulatedAmount).toBe(200);
    });

    it('deve retornar erro se goal estiver deletada', () => {
      const goal = Goal.create(makeDTO()).data!;
      goal.delete();
      const result = goal.addAmount(100);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAlreadyDeletedError);
    });

    it('deve permitir adicionar mesmo se goal já estiver atingida (over-reserving)', () => {
      const goal = Goal.create(makeDTO({ accumulatedAmount: 1000 })).data!;
      const result = goal.addAmount(10);

      expect(result.hasError).toBe(false);
      expect(goal.accumulatedAmount).toBe(1010);
    });

    it('deve permitir ultrapassar o valor total (over-reserving)', () => {
      const goal = Goal.create(makeDTO()).data!;
      const result = goal.addAmount(2000);

      expect(result.hasError).toBe(false);
      expect(goal.accumulatedAmount).toBe(2000);
    });
  });

  describe('removeAmount', () => {
    it('deve remover aporte válido', () => {
      const goal = Goal.create(makeDTO({ accumulatedAmount: 500 })).data!;
      const result = goal.removeAmount(200);

      expect(result.hasError).toBe(false);
      expect(goal.accumulatedAmount).toBe(300);
    });

    it('deve retornar erro se goal estiver deletada', () => {
      const goal = Goal.create(makeDTO({ accumulatedAmount: 500 })).data!;
      goal.delete();
      const result = goal.removeAmount(100);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAlreadyDeletedError);
    });

    it('deve retornar erro se tentar remover mais do que tem acumulado', () => {
      const goal = Goal.create(makeDTO({ accumulatedAmount: 100 })).data!;
      const result = goal.removeAmount(200);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidGoalAmountError);
    });

    it('deve permitir remover tudo (zerar acumulado)', () => {
      const goal = Goal.create(makeDTO({ accumulatedAmount: 500 })).data!;
      const result = goal.removeAmount(500);

      expect(result.hasError).toBe(false);
      expect(goal.accumulatedAmount).toBe(0);
    });
  });

  describe('delete', () => {
    it('deve deletar meta', () => {
      const goal = Goal.create(makeDTO()).data!;
      const result = goal.delete();

      expect(result.hasError).toBe(false);
      expect(goal.isDeleted).toBe(true);
    });

    it('deve retornar erro se deletar duas vezes', () => {
      const goal = Goal.create(makeDTO()).data!;
      goal.delete();
      const result = goal.delete();
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAlreadyDeletedError);
    });
  });
});

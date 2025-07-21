import { InvalidEntityNameError } from '../../../shared/errors/InvalidEntityNameError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';
import { InvalidEntityIdError } from '../../../shared/errors/InvalidEntityIdError';
import { Goal } from './Goal';
import { GoalAlreadyDeletedError } from '../errors/GoalAlreadyDeletedError';
import { GoalAlreadyAchievedError } from '../errors/GoalAlreadyAchievedError';
import { InvalidGoalAmountError } from '../errors/InvalidGoalAmountError';

const validName = 'Minha Meta';
const validTotal = 1000;
const validBudgetId = EntityId.create().value!.id;
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

describe('Goal', () => {
  describe('create', () => {
    it('deve criar uma meta válida e emitir evento', () => {
      const result = Goal.create(makeDTO());

      expect(result.hasError).toBe(false);
      const goal = result.data!;
      expect(goal.getEvents().length).toBe(1);
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
    it('deve adicionar aporte válido e emitir eventos', () => {
      const goal = Goal.create(makeDTO()).data!;
      const result = goal.addAmount(200);

      expect(result.hasError).toBe(false);
      expect(goal.accumulatedAmount).toBe(200);
      expect(goal.getEvents().length).toBe(2); // created + addAmount
    });

    it('deve retornar erro se goal estiver deletada', () => {
      const goal = Goal.create(makeDTO()).data!;
      goal.delete();
      const result = goal.addAmount(100);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAlreadyDeletedError);
    });

    it('deve retornar erro se goal já estiver atingida', () => {
      const goal = Goal.create(makeDTO({ accumulatedAmount: 1000 })).data!;
      const result = goal.addAmount(10);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAlreadyAchievedError);
    });

    it('nao deve permitir ultrapassar o valor total', () => {
      const goal = Goal.create(makeDTO()).data!;
      const result = goal.addAmount(2000);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InvalidGoalAmountError);
    });
  });

  describe('delete', () => {
    it('deve deletar meta e emitir evento', () => {
      const goal = Goal.create(makeDTO()).data!;
      const result = goal.delete();

      expect(result.hasError).toBe(false);
      expect(goal.isDeleted).toBe(true);
      expect(goal.getEvents().length).toBe(2); // created + deleted
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

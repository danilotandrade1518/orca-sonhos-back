import { Account } from '@domain/aggregates/account/account-entity/Account';
import { InsufficientBalanceError } from '@domain/aggregates/account/errors/InsufficientBalanceError';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { GoalAccountMismatchError } from '../errors/GoalAccountMismatchError';
import { Goal } from '../goal-entity/Goal';
import { GoalReservationDomainService } from './GoalReservationDomainService';

describe('GoalReservationDomainService', () => {
  let domainService: GoalReservationDomainService;
  const validBudgetId = EntityId.create().value!.id;
  const differentBudgetId = EntityId.create().value!.id;

  beforeEach(() => {
    domainService = new GoalReservationDomainService();
  });

  const createValidAccount = (
    budgetId = validBudgetId,
    initialBalance = 5000,
    accountType = AccountTypeEnum.CHECKING_ACCOUNT,
  ) =>
    Account.create({
      name: 'Conta Principal',
      type: accountType,
      budgetId,
      initialBalance,
    }).data!;

  const createValidGoal = (
    budgetId = validBudgetId,
    sourceAccountId = validBudgetId,
    accumulatedAmount = 0,
  ) =>
    Goal.create({
      name: 'Meta Teste',
      totalAmount: 1000,
      budgetId,
      sourceAccountId,
      accumulatedAmount,
    }).data!;

  describe('validateReservationOperation', () => {
    it('should validate successfully when goal and account are from same budget and balance is sufficient', () => {
      const sourceAccount = createValidAccount(validBudgetId, 5000);
      const goal = createValidGoal(validBudgetId, sourceAccount.id, 500);
      const otherGoal = createValidGoal(validBudgetId, sourceAccount.id, 1000);
      const allGoals = [goal, otherGoal];

      const result = domainService.validateReservationOperation({
        goal,
        sourceAccount,
        allGoalsFromAccount: allGoals,
        additionalAmount: 200,
      });

      expect(result.hasError).toBe(false);
    });

    it('should return error when goal and account are from different budgets', () => {
      const sourceAccount = createValidAccount(validBudgetId);
      const goal = createValidGoal(differentBudgetId, sourceAccount.id);

      const result = domainService.validateReservationOperation({
        goal,
        sourceAccount,
        allGoalsFromAccount: [goal],
        additionalAmount: 100,
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(GoalAccountMismatchError);
    });

    it('should return error when there is insufficient balance for reservation', () => {
      const sourceAccount = createValidAccount(
        validBudgetId,
        1000,
        AccountTypeEnum.SAVINGS_ACCOUNT,
      ); // Savings account doesn't allow negative balance
      const goal = createValidGoal(validBudgetId, sourceAccount.id, 500);
      const otherGoal = createValidGoal(validBudgetId, sourceAccount.id, 400);
      const allGoals = [goal, otherGoal];

      const result = domainService.validateReservationOperation({
        goal,
        sourceAccount,
        allGoalsFromAccount: allGoals,
        additionalAmount: 200, // This would make total reservation 1100 (400 + 500 + 200) > 1000 balance
      });

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InsufficientBalanceError);
    });

    it('should calculate total reserved correctly excluding current goal', () => {
      const sourceAccount = createValidAccount(validBudgetId, 2000);
      const goal = createValidGoal(validBudgetId, sourceAccount.id, 300);
      const otherGoal1 = createValidGoal(validBudgetId, sourceAccount.id, 400);
      const otherGoal2 = createValidGoal(validBudgetId, sourceAccount.id, 600);
      const allGoals = [goal, otherGoal1, otherGoal2];

      const result = domainService.validateReservationOperation({
        goal,
        sourceAccount,
        allGoalsFromAccount: allGoals,
        additionalAmount: 100, // Total would be: 1000 (other goals) + 400 (300+100) = 1400
      });

      expect(result.hasError).toBe(false);
    });

    it('should handle empty goals array', () => {
      const sourceAccount = createValidAccount(validBudgetId, 1000);
      const goal = createValidGoal(validBudgetId, sourceAccount.id, 0);

      const result = domainService.validateReservationOperation({
        goal,
        sourceAccount,
        allGoalsFromAccount: [],
        additionalAmount: 500,
      });

      expect(result.hasError).toBe(false);
    });

    it('should handle zero additional amount', () => {
      const sourceAccount = createValidAccount(validBudgetId, 1000);
      const goal = createValidGoal(validBudgetId, sourceAccount.id, 500);
      const otherGoal = createValidGoal(validBudgetId, sourceAccount.id, 400);
      const allGoals = [goal, otherGoal];

      const result = domainService.validateReservationOperation({
        goal,
        sourceAccount,
        allGoalsFromAccount: allGoals,
        additionalAmount: 0,
      });

      expect(result.hasError).toBe(false);
    });
  });
});

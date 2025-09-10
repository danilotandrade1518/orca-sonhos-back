import { Either } from '@either';

import { DomainError } from '../../../shared/DomainError';
import { Account } from '../../account/account-entity/Account';
import { GoalAccountMismatchError } from '../errors/GoalAccountMismatchError';
import { Goal } from '../goal-entity/Goal';

export interface ValidateReservationOperationParams {
  goal: Goal;
  sourceAccount: Account;
  allGoalsFromAccount: Goal[];
  additionalAmount: number;
}

export class GoalReservationDomainService {
  validateReservationOperation(
    params: ValidateReservationOperationParams,
  ): Either<DomainError, void> {
    const { goal, sourceAccount, allGoalsFromAccount, additionalAmount } =
      params;

    const budgetValidationResult = this.validateSameBudget(goal, sourceAccount);
    if (budgetValidationResult.hasError) {
      return budgetValidationResult;
    }

    const balanceValidationResult = this.validateAvailableBalance(
      goal,
      sourceAccount,
      allGoalsFromAccount,
      additionalAmount,
    );
    if (balanceValidationResult.hasError) {
      return balanceValidationResult;
    }

    const addAmountResult = goal.addAmount(params.additionalAmount);
    if (addAmountResult.hasError) {
      return Either.errors<DomainError, void>(addAmountResult.errors);
    }

    return Either.success(undefined);
  }

  private validateSameBudget(
    goal: Goal,
    sourceAccount: Account,
  ): Either<DomainError, void> {
    if (goal.budgetId !== sourceAccount.budgetId) {
      return Either.error<DomainError, void>(new GoalAccountMismatchError());
    }

    return Either.success(undefined);
  }

  private validateAvailableBalance(
    goal: Goal,
    sourceAccount: Account,
    allGoalsFromAccount: Goal[],
    additionalAmount: number,
  ): Either<DomainError, void> {
    const totalReservedForOtherGoals = allGoalsFromAccount
      .filter((g) => g.id !== goal.id)
      .reduce((total, g) => total + g.accumulatedAmount, 0);

    const newGoalAmount = goal.accumulatedAmount + additionalAmount;
    const totalReservedAmount = totalReservedForOtherGoals + newGoalAmount;

    const availableBalanceResult =
      sourceAccount.getAvailableBalance(totalReservedAmount);

    if (availableBalanceResult.hasError) {
      return Either.errors<DomainError, void>(availableBalanceResult.errors);
    }

    return Either.success(undefined);
  }
}

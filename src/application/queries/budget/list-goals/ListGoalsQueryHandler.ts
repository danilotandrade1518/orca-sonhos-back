import {
  GoalListItem,
  IListGoalsDao,
} from '@application/contracts/daos/goal/IListGoalsDao';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { InsufficientPermissionsError } from '@application/shared/errors/InsufficientPermissionsError';
import { IQueryHandler } from '../../shared/IQueryHandler';

export interface ListGoalsQuery {
  budgetId: string;
  userId: string;
}

export interface ListGoalsItem {
  id: string;
  name: string;
  totalAmount: number;
  accumulatedAmount: number;
  deadline: string | null;
  budgetId: string;
  sourceAccountId?: string;
  status: 'on-track' | 'overdue' | 'ahead' | 'completed';
}

export type ListGoalsQueryResult = ListGoalsItem[];

export class ListGoalsQueryHandler
  implements IQueryHandler<ListGoalsQuery, ListGoalsQueryResult>
{
  constructor(
    private readonly listGoalsDao: IListGoalsDao,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(query: ListGoalsQuery): Promise<ListGoalsQueryResult> {
    const { budgetId, userId } = query;
    if (!budgetId || !userId) {
      throw new Error('INVALID_INPUT');
    }

    const auth = await this.budgetAuthorizationService.canAccessBudget(
      userId,
      budgetId,
    );
    if (auth.hasError) throw auth.errors[0];
    if (!auth.data) throw new InsufficientPermissionsError();

    const items = await this.listGoalsDao.findByBudget({ budgetId });
    const now = new Date();

    return (
      items?.map((i: GoalListItem) => {
        const status = this.calculateGoalStatus(
          i.totalAmount,
          i.accumulatedAmount,
          i.deadline,
          now,
        );
        return {
          id: i.id,
          name: i.name,
          totalAmount: i.totalAmount,
          accumulatedAmount: i.accumulatedAmount,
          deadline: i.deadline,
          budgetId: i.budgetId,
          sourceAccountId: i.sourceAccountId,
          status,
        };
      }) || []
    );
  }

  private calculateGoalStatus(
    totalAmount: number,
    accumulatedAmount: number,
    deadline: string | null,
    now: Date,
  ): 'on-track' | 'overdue' | 'ahead' | 'completed' {
    if (accumulatedAmount >= totalAmount) {
      return 'completed';
    }

    if (!deadline) {
      return 'on-track';
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= now) {
      return accumulatedAmount >= totalAmount ? 'completed' : 'overdue';
    }

    const progress =
      totalAmount > 0 ? (accumulatedAmount / totalAmount) * 100 : 0;

    const monthsRemaining = this.calculateMonthsRemaining(now, deadlineDate);
    const expectedProgress =
      monthsRemaining > 0
        ? Math.max(0, 100 - (monthsRemaining / 12) * 100)
        : 100;

    if (progress >= expectedProgress) {
      return 'on-track';
    } else if (progress < expectedProgress - 10) {
      return 'overdue';
    } else {
      return 'ahead';
    }
  }

  private calculateMonthsRemaining(start: Date, end: Date): number {
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    const dayDiff = end.getDate() - start.getDate();

    let months = yearDiff * 12 + monthDiff;

    if (dayDiff < 0) {
      months -= 1;
    }

    return Math.max(months, 0);
  }
}

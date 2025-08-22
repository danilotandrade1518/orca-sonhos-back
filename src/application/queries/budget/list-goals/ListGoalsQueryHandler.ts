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
  targetAmount: number;
  currentAmount: number;
  percentAchieved: number;
  dueDate: string | null;
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

    return (
      items?.map((i: GoalListItem) => {
        const percent =
          i.targetAmount === 0 ? 0 : i.currentAmount / i.targetAmount;

        return {
          id: i.id,
          name: i.name,
          targetAmount: i.targetAmount,
          currentAmount: i.currentAmount,
          percentAchieved: percent,
          dueDate: i.dueDate,
        };
      }) || []
    );
  }
}

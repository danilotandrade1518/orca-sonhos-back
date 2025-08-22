/*
 * Acceptance Checklist
 * [ ] DAO interface created
 * [ ] DAO implemented with auth check + listing
 * [ ] Handler validates input and adapts output (percentAchieved, status)
 * [ ] Specs passing (DAO + Handler)
 * [ ] docs/query-view-planning.md updated row
 * [ ] No other files changed
 * [ ] Route NOT registered
 */
import {
  GoalListItem,
  IListGoalsDao,
} from '@application/contracts/daos/goal/IListGoalsDao';
import { IQueryHandler } from '../../shared/IQueryHandler';

export interface ListGoalsQuery {
  budgetId: string;
  userId: string;
}

export type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'OVERDUE';

export interface ListGoalsItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentAchieved: number;
  dueDate: string | null;
  status: GoalStatus;
}

export type ListGoalsQueryResult = ListGoalsItem[];

export class ListGoalsQueryHandler
  implements IQueryHandler<ListGoalsQuery, ListGoalsQueryResult>
{
  constructor(private readonly listGoalsDao: IListGoalsDao) {}

  async execute(query: ListGoalsQuery): Promise<ListGoalsQueryResult> {
    const { budgetId, userId } = query;
    if (!budgetId || !userId) {
      throw new Error('INVALID_INPUT');
    }

    const items = await this.listGoalsDao.findByBudgetForUser(budgetId, userId);
    if (items === null) {
      throw new Error('NOT_FOUND');
    }

    const today = new Date().toISOString().slice(0, 10);

    return items.map((i: GoalListItem) => {
      const percent = i.targetAmount === 0 ? 0 : i.currentAmount / i.targetAmount;
      let status: GoalStatus = 'ACTIVE';
      if (i.targetAmount > 0 && i.currentAmount >= i.targetAmount) {
        status = 'ACHIEVED';
      } else if (i.dueDate && today > i.dueDate) {
        status = 'OVERDUE';
      }

      return {
        id: i.id,
        name: i.name,
        targetAmount: i.targetAmount,
        currentAmount: i.currentAmount,
        percentAchieved: percent,
        dueDate: i.dueDate,
        status,
      };
    });
  }
}

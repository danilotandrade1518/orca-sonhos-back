import {
  GoalListItem,
  IListGoalsDao,
} from '@application/contracts/daos/goal/IListGoalsDao';
import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';

import {
  ListGoalsQuery,
  ListGoalsQueryHandler,
  ListGoalsQueryResult,
} from './ListGoalsQueryHandler';

describe('ListGoalsQueryHandler', () => {
  class ListGoalsDaoStub implements IListGoalsDao {
    public result: GoalListItem[] = [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async findByBudget(params: { budgetId: string }): Promise<GoalListItem[]> {
      return this.result;
    }
  }

  let dao: ListGoalsDaoStub;
  let handler: ListGoalsQueryHandler;

  beforeEach(() => {
    dao = new ListGoalsDaoStub();
    handler = new ListGoalsQueryHandler(
      dao,
      new BudgetAuthorizationServiceStub(),
    );
    jest.useFakeTimers().setSystemTime(new Date('2024-01-10'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const query: ListGoalsQuery = { budgetId: 'b1', userId: 'u1' };

  it('should return empty array when dao returns empty array', async () => {
    dao.result = [];
    const result = await handler.execute(query);
    expect(result).toEqual([]);
  });

  it('should return goals with correct fields', async () => {
    dao.result = [
      {
        id: '1',
        name: 'g1',
        totalAmount: 0,
        accumulatedAmount: 100,
        deadline: null,
        budgetId: 'b1',
      },
      {
        id: '2',
        name: 'g2',
        totalAmount: 1000,
        accumulatedAmount: 1000,
        deadline: '2024-01-05',
        budgetId: 'b1',
      },
      {
        id: '3',
        name: 'g3',
        totalAmount: 1000,
        accumulatedAmount: 200,
        deadline: '2024-01-01',
        budgetId: 'b1',
      },
      {
        id: '4',
        name: 'g4',
        totalAmount: 1000,
        accumulatedAmount: 200,
        deadline: '2024-02-01',
        budgetId: 'b1',
        sourceAccountId: 'acc1',
      },
    ];

    const result: ListGoalsQueryResult = await handler.execute(query);

    expect(result).toEqual([
      {
        id: '1',
        name: 'g1',
        totalAmount: 0,
        accumulatedAmount: 100,
        deadline: null,
        budgetId: 'b1',
      },
      {
        id: '2',
        name: 'g2',
        totalAmount: 1000,
        accumulatedAmount: 1000,
        deadline: '2024-01-05',
        budgetId: 'b1',
      },
      {
        id: '3',
        name: 'g3',
        totalAmount: 1000,
        accumulatedAmount: 200,
        deadline: '2024-01-01',
        budgetId: 'b1',
      },
      {
        id: '4',
        name: 'g4',
        totalAmount: 1000,
        accumulatedAmount: 200,
        deadline: '2024-02-01',
        budgetId: 'b1',
        sourceAccountId: 'acc1',
      },
    ]);
  });
});

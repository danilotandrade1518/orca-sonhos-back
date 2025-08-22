import {
  GoalListItem,
  IListGoalsDao,
} from '@application/contracts/daos/goal/IListGoalsDao';

import {
  ListGoalsQuery,
  ListGoalsQueryHandler,
  ListGoalsQueryResult,
} from './ListGoalsQueryHandler';

describe('ListGoalsQueryHandler', () => {
  class ListGoalsDaoStub implements IListGoalsDao {
    public result: GoalListItem[] | null = [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async findByBudgetForUser(params: {
      budgetId: string;
      userId: string;
    }): Promise<GoalListItem[] | null> {
      return this.result;
    }
  }

  let dao: ListGoalsDaoStub;
  let handler: ListGoalsQueryHandler;

  beforeEach(() => {
    dao = new ListGoalsDaoStub();
    handler = new ListGoalsQueryHandler(dao);
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

  it('should calculate percentAchieved and status correctly', async () => {
    dao.result = [
      {
        id: '1',
        name: 'g1',
        targetAmount: 0,
        currentAmount: 100,
        dueDate: null,
      },
      {
        id: '2',
        name: 'g2',
        targetAmount: 1000,
        currentAmount: 1000,
        dueDate: '2024-01-05',
      },
      {
        id: '3',
        name: 'g3',
        targetAmount: 1000,
        currentAmount: 200,
        dueDate: '2024-01-01',
      },
      {
        id: '4',
        name: 'g4',
        targetAmount: 1000,
        currentAmount: 200,
        dueDate: '2024-02-01',
      },
    ];

    const result: ListGoalsQueryResult = await handler.execute(query);

    expect(result).toEqual([
      {
        id: '1',
        name: 'g1',
        targetAmount: 0,
        currentAmount: 100,
        percentAchieved: 0,
        dueDate: null,
      },
      {
        id: '2',
        name: 'g2',
        targetAmount: 1000,
        currentAmount: 1000,
        percentAchieved: 1,
        dueDate: '2024-01-05',
      },
      {
        id: '3',
        name: 'g3',
        targetAmount: 1000,
        currentAmount: 200,
        percentAchieved: 0.2,
        dueDate: '2024-01-01',
      },
      {
        id: '4',
        name: 'g4',
        targetAmount: 1000,
        currentAmount: 200,
        percentAchieved: 0.2,
        dueDate: '2024-02-01',
      },
    ]);
  });
});

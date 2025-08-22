import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { ListGoalsDao } from './ListGoalsDao';

describe('ListGoalsDao', () => {
  let dao: ListGoalsDao;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
    } as unknown as jest.Mocked<IPostgresConnectionAdapter>;

    dao = new ListGoalsDao(mockConnection);
  });

  it('should return empty array when no goals are found', async () => {
    mockConnection.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const result = await dao.findByBudget({ budgetId: 'b1' });

    expect(result).toEqual([]);
  });

  it('should map rows correctly', async () => {
    mockConnection.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'g1',
          name: 'Goal 1',
          total_amount: 1000,
          accumulated_amount: 200,
          due_date: '2024-12-31',
        },
      ],
      rowCount: 1,
    });

    const result = await dao.findByBudget({ budgetId: 'b1' });

    expect(result).toEqual([
      {
        id: 'g1',
        name: 'Goal 1',
        targetAmount: 1000,
        currentAmount: 200,
        dueDate: '2024-12-31',
      },
    ]);
  });
});

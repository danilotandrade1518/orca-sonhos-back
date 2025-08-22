import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { ListTransactionsDao } from './ListTransactionsDao';

describe('ListTransactionsDao', () => {
  let dao: ListTransactionsDao;
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

    dao = new ListTransactionsDao(mockConnection);
  });

  it('should return null when user not authorized', async () => {
    mockConnection.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const result = await dao.findPageForBudgetUser({
      budgetId: 'b1',
      userId: 'u1',
      offset: 0,
      limit: 21,
    });

    expect(result).toBeNull();
    expect(mockConnection.query).toHaveBeenCalledTimes(1);
  });

  it('should return empty rows when no transactions', async () => {
    mockConnection.query
      .mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const result = await dao.findPageForBudgetUser({
      budgetId: 'b1',
      userId: 'u1',
      offset: 0,
      limit: 21,
    });

    expect(result).toEqual({ rows: [], hasNext: false });
  });

  it('should map rows and compute hasNext using limit+1', async () => {
    mockConnection.query
      .mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 't3',
            date: '2023-01-03',
            description: 'd3',
            amount_cents: 300,
            direction: 'IN',
            account_id: 'a1',
            category_id: 'c1',
          },
          {
            id: 't2',
            date: '2023-01-02',
            description: null,
            amount_cents: -200,
            direction: 'OUT',
            account_id: 'a1',
            category_id: null,
          },
          {
            id: 't1',
            date: '2023-01-01',
            description: 'd1',
            amount_cents: 100,
            direction: 'IN',
            account_id: 'a2',
            category_id: 'c2',
          },
        ],
        rowCount: 3,
      });

    const result = await dao.findPageForBudgetUser({
      budgetId: 'b1',
      userId: 'u1',
      offset: 0,
      limit: 3,
    });

    expect(result?.hasNext).toBe(true);
    expect(result?.rows).toHaveLength(2);
    expect(result?.rows[0]).toEqual({
      id: 't3',
      date: '2023-01-03',
      description: 'd3',
      amount: 300,
      direction: 'IN',
      accountId: 'a1',
      categoryId: 'c1',
    });
  });

  it('should apply filters correctly', async () => {
    mockConnection.query
      .mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await dao.findPageForBudgetUser({
      budgetId: 'b1',
      userId: 'u1',
      offset: 10,
      limit: 11,
      accountId: 'a9',
      categoryId: 'c9',
      dateFrom: '2023-01-01',
      dateTo: '2023-01-31',
    });

    const call = mockConnection.query.mock.calls[1];
    expect(call[0]).toContain('account_id = $2');
    expect(call[0]).toContain('category_id = $3');
    expect(call[0]).toContain('occurred_on >= $4::date');
    expect(call[0]).toContain('occurred_on <= $5::date');
    expect(call[0]).toContain('LIMIT $6 OFFSET $7');
    expect(call[1]).toEqual([
      'b1',
      'a9',
      'c9',
      '2023-01-01',
      '2023-01-31',
      11,
      10,
    ]);
  });
});

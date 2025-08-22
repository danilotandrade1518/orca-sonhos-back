import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { ListEnvelopesDao } from './ListEnvelopesDao';

describe('ListEnvelopesDao', () => {
  let dao: ListEnvelopesDao;
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
    dao = new ListEnvelopesDao(mockConnection);
  });

  it('should return null when user unauthorized', async () => {
    mockConnection.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const result = await dao.findByBudgetForUser({
      budgetId: 'b1',
      userId: 'u1',
    });
    expect(result).toBeNull();
    expect(mockConnection.query).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when no envelopes', async () => {
    mockConnection.query
      .mockResolvedValueOnce({ rows: [{ exists: 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });
    const result = await dao.findByBudgetForUser({
      budgetId: 'b1',
      userId: 'u1',
    });
    expect(result).toEqual([]);
    expect(mockConnection.query).toHaveBeenCalledTimes(2);
  });

  it('should map rows correctly', async () => {
    mockConnection.query
      .mockResolvedValueOnce({ rows: [{ exists: 1 }], rowCount: 1 })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'e1',
            name: 'Food',
            allocated_cents: '1000',
            spent_cents: '300',
          },
          {
            id: 'e2',
            name: 'Rent',
            allocated_cents: '2000',
            spent_cents: null,
          },
        ],
        rowCount: 2,
      });
    const result = await dao.findByBudgetForUser({
      budgetId: 'b1',
      userId: 'u1',
    });
    expect(result).toEqual([
      { id: 'e1', name: 'Food', allocated: 1000, spent: 300 },
      { id: 'e2', name: 'Rent', allocated: 2000, spent: 0 },
    ]);
  });
});

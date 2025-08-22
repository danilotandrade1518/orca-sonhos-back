import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { ListAccountsDao } from './ListAccountsDao';

describe('ListAccountsDao', () => {
  let dao: ListAccountsDao;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
    } as unknown as jest.Mocked<IPostgresConnectionAdapter>;

    dao = new ListAccountsDao(mockConnection);
  });

  it('should return empty array when no accounts', async () => {
    mockConnection.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const result = await dao.findByBudget({ budgetId: 'b1' });
    expect(result).toEqual([]);
    expect(mockConnection.query).toHaveBeenCalledTimes(1);
  });

  it('should map rows to ListAccountsItem', async () => {
    mockConnection.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'a1',
          name: 'Conta',
          type: 'CHECKING',
          balance: '1000',
        },
      ],
      rowCount: 1,
    });

    const result = await dao.findByBudget({ budgetId: 'b1' });
    expect(result).toEqual([
      { id: 'a1', name: 'Conta', type: 'CHECKING', balance: 1000 },
    ]);
  });
});

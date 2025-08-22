import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { ListCategoriesDao } from './ListCategoriesDao';

describe('ListCategoriesDao', () => {
  let dao: ListCategoriesDao;
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

    dao = new ListCategoriesDao(mockConnection);
  });

  it('should return empty array when no categories', async () => {
    mockConnection.query
      .mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      .mockResolvedValue({ rows: [], rowCount: 0 });

    const result = await dao.findAll({
      budgetId: 'b1',
      userId: 'u1',
    });

    expect(mockConnection.query).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('should map rows correctly', async () => {
    mockConnection.query.mockResolvedValue({
      rows: [
        { id: 'c1', name: 'Salary', type: 'INCOME' },
        { id: 'c2', name: 'Food', type: 'EXPENSE' },
      ],
      rowCount: 2,
    });

    const result = await dao.findAll({
      budgetId: 'b1',
      userId: 'u1',
    });

    expect(mockConnection.query).toHaveBeenCalled();
    expect(result).toEqual([
      { id: 'c1', name: 'Salary', type: 'INCOME' },
      { id: 'c2', name: 'Food', type: 'EXPENSE' },
    ]);
  });
});

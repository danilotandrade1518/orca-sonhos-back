import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { ListBudgetsDao } from './ListBudgetsDao';

describe('ListBudgetsDao', () => {
  let dao: ListBudgetsDao;
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
    };

    dao = new ListBudgetsDao(mockConnection);
  });

  it('should map rows correctly', async () => {
    mockConnection.query.mockResolvedValue({
      rows: [
        {
          id: 'b1',
          name: 'Meu Budget',
          type: 'PERSONAL',
          participantscount: '2',
        },
      ],
      rowCount: 1,
    });

    const result = await dao.findByUser({ userId: 'user-1' });

    expect(mockConnection.query).toHaveBeenCalled();
    expect(result).toEqual([
      { id: 'b1', name: 'Meu Budget', type: 'PERSONAL', participantsCount: 2 },
    ]);
  });
});

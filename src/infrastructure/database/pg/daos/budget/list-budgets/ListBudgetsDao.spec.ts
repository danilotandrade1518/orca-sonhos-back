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
    expect(mockConnection.query).toHaveBeenCalledWith(
      expect.stringContaining('AND b.is_deleted = false'),
      ['user-1'],
    );
    expect(result).toEqual([
      { id: 'b1', name: 'Meu Budget', type: 'PERSONAL', participantsCount: 2 },
    ]);
  });

  it('should filter deleted budgets by default', async () => {
    mockConnection.query.mockResolvedValue({
      rows: [],
      rowCount: 0,
    });

    await dao.findByUser({ userId: 'user-1' });

    expect(mockConnection.query).toHaveBeenCalledWith(
      expect.stringContaining('AND b.is_deleted = false'),
      ['user-1'],
    );
  });

  it('should include deleted budgets when includeDeleted is true', async () => {
    mockConnection.query.mockResolvedValue({
      rows: [
        {
          id: 'b1',
          name: 'Deleted Budget',
          type: 'PERSONAL',
          participantscount: '0',
        },
      ],
      rowCount: 1,
    });

    const result = await dao.findByUser({
      userId: 'user-1',
      includeDeleted: true,
    });

    expect(mockConnection.query).toHaveBeenCalledWith(
      expect.not.stringContaining('AND b.is_deleted = false'),
      ['user-1'],
    );
    expect(result).toEqual([
      {
        id: 'b1',
        name: 'Deleted Budget',
        type: 'PERSONAL',
        participantsCount: 0,
      },
    ]);
  });

  it('should filter deleted budgets when includeDeleted is false', async () => {
    mockConnection.query.mockResolvedValue({
      rows: [],
      rowCount: 0,
    });

    await dao.findByUser({ userId: 'user-1', includeDeleted: false });

    expect(mockConnection.query).toHaveBeenCalledWith(
      expect.stringContaining('AND b.is_deleted = false'),
      ['user-1'],
    );
  });
});

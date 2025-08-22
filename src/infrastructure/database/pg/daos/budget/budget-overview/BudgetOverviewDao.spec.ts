import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { BudgetOverviewDao } from './BudgetOverviewDao';

describe('BudgetOverviewDao', () => {
  let dao: BudgetOverviewDao;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    } as unknown as jest.Mocked<IPostgresConnectionAdapter>;
    dao = new BudgetOverviewDao(mockConnection);
  });

  it('should map monthly aggregates', async () => {
    mockConnection.query.mockResolvedValue({
      rows: [{ income: '5000', expense: '2000' }],
      rowCount: 1,
    });
    const result = await dao.fetchMonthlyAggregates({
      budgetId: 'b1',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-02-01'),
    });
    expect(result).toEqual({ income: 5000, expense: 2000 });
  });

  it('should return zeros when no transactions', async () => {
    mockConnection.query.mockResolvedValue({ rows: [], rowCount: 0 });
    const result = await dao.fetchMonthlyAggregates({
      budgetId: 'b1',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-02-01'),
    });
    expect(result).toEqual({ income: 0, expense: 0 });
  });

  it('should return null when user has no access', async () => {
    mockConnection.query.mockResolvedValue({ rows: [], rowCount: 0 });
    const result = await dao.fetchBudgetCore({
      budgetId: 'b1',
    });
    expect(result).toBeNull();
  });

  it('should deduplicate participants', async () => {
    mockConnection.query.mockResolvedValue({
      rows: [{ owner_id: 'u1', participant_ids: ['u1', 'u2'] }],
      rowCount: 1,
    });
    const result = await dao.fetchParticipants({
      budgetId: 'b1',
    });
    expect(result).toEqual([{ id: 'u1' }, { id: 'u2' }]);
  });
});

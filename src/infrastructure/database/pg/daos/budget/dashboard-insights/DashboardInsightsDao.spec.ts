import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { DashboardInsightsDao } from './DashboardInsightsDao';

describe('DashboardInsightsDao', () => {
  let dao: DashboardInsightsDao;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    } as unknown as jest.Mocked<IPostgresConnectionAdapter>;
    dao = new DashboardInsightsDao(mockConnection);
  });

  describe('fetchAggregates', () => {
    it('should combine all aggregates correctly', async () => {
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-02-01');

      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '10000', expense_month: '5000' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              category_id: 'cat-1',
              category_name: 'Alimentação',
              total_amount: '3000',
              transaction_count: '5',
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '8000' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '50000' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'goal-1',
              name: 'Meta Teste',
              total_amount: '10000',
              accumulated_amount: '5000',
              deadline: '2024-12-31',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-15T00:00:00Z',
            },
          ],
          rowCount: 1,
        });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart,
        periodEnd,
      });

      expect(result.monthlyFinancial).toEqual({
        incomeMonth: 10000,
        expenseMonth: 5000,
      });
      expect(result.categorySpending).toEqual([
        {
          categoryId: 'cat-1',
          categoryName: 'Alimentação',
          totalAmount: 3000,
          transactionCount: 5,
        },
      ]);
      expect(result.envelopeLimits).toEqual({ totalMonthlyLimit: 8000 });
      expect(result.accountsBalance).toEqual({ totalBalance: 50000 });
      expect(result.goals).toHaveLength(1);
      expect(result.goals[0]).toMatchObject({
        id: 'goal-1',
        name: 'Meta Teste',
        targetAmount: 10000,
        currentAmount: 5000,
      });
    });
  });

  describe('fetchMonthlyFinancialAggregates', () => {
    it('should return monthly financial aggregates', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ income_month: '15000', expense_month: '8000' }],
        rowCount: 1,
      });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.monthlyFinancial).toEqual({
        incomeMonth: 15000,
        expenseMonth: 8000,
      });
    });

    it('should return zeros when no transactions', async () => {
      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '0', expense_month: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.monthlyFinancial).toEqual({
        incomeMonth: 0,
        expenseMonth: 0,
      });
    });
  });

  describe('fetchCategorySpending', () => {
    it('should return category spending aggregates', async () => {
      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '0', expense_month: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              category_id: 'cat-1',
              category_name: 'Alimentação',
              total_amount: '5000',
              transaction_count: '10',
            },
            {
              category_id: 'cat-2',
              category_name: 'Transporte',
              total_amount: '3000',
              transaction_count: '5',
            },
          ],
          rowCount: 2,
        })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.categorySpending).toHaveLength(2);
      expect(result.categorySpending[0]).toEqual({
        categoryId: 'cat-1',
        categoryName: 'Alimentação',
        totalAmount: 5000,
        transactionCount: 10,
      });
      expect(result.categorySpending[1]).toEqual({
        categoryId: 'cat-2',
        categoryName: 'Transporte',
        totalAmount: 3000,
        transactionCount: 5,
      });
    });

    it('should return empty array when no category spending', async () => {
      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '0', expense_month: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.categorySpending).toEqual([]);
    });
  });

  describe('fetchEnvelopeLimits', () => {
    it('should return envelope limits aggregate', async () => {
      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '0', expense_month: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '12000' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.envelopeLimits).toEqual({ totalMonthlyLimit: 12000 });
    });

    it('should return zero when no envelopes', async () => {
      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '0', expense_month: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.envelopeLimits).toEqual({ totalMonthlyLimit: 0 });
    });
  });

  describe('fetchAccountsBalance', () => {
    it('should return accounts balance aggregate', async () => {
      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '0', expense_month: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '75000' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.accountsBalance).toEqual({ totalBalance: 75000 });
    });

    it('should return zero when no accounts', async () => {
      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '0', expense_month: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.accountsBalance).toEqual({ totalBalance: 0 });
    });
  });

  describe('fetchGoalsStatus', () => {
    it('should return goals status with all fields', async () => {
      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '0', expense_month: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'goal-1',
              name: 'Meta 1',
              total_amount: '20000',
              accumulated_amount: '10000',
              deadline: '2024-12-31',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-15T00:00:00Z',
            },
            {
              id: 'goal-2',
              name: 'Meta 2',
              total_amount: '50000',
              accumulated_amount: '50000',
              deadline: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-20T00:00:00Z',
            },
          ],
          rowCount: 2,
        });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.goals).toHaveLength(2);
      expect(result.goals[0]).toMatchObject({
        id: 'goal-1',
        name: 'Meta 1',
        targetAmount: 20000,
        currentAmount: 10000,
        deadline: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result.goals[1]).toMatchObject({
        id: 'goal-2',
        name: 'Meta 2',
        targetAmount: 50000,
        currentAmount: 50000,
        deadline: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should return empty array when no goals', async () => {
      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '0', expense_month: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.goals).toEqual([]);
    });

    it('should handle Date objects in created_at and updated_at', async () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const updatedAt = new Date('2024-01-15T00:00:00Z');

      mockConnection.query
        .mockResolvedValueOnce({
          rows: [{ income_month: '0', expense_month: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{ total_monthly_limit: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ total_balance: '0' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'goal-1',
              name: 'Meta 1',
              total_amount: '10000',
              accumulated_amount: '5000',
              deadline: '2024-12-31',
              created_at: createdAt,
              updated_at: updatedAt,
            },
          ],
          rowCount: 1,
        });

      const result = await dao.fetchAggregates({
        budgetId: 'b1',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-02-01'),
      });

      expect(result.goals[0].createdAt).toBeInstanceOf(Date);
      expect(result.goals[0].updatedAt).toBeInstanceOf(Date);
      expect(result.goals[0].createdAt.getTime()).toBe(createdAt.getTime());
      expect(result.goals[0].updatedAt.getTime()).toBe(updatedAt.getTime());
    });
  });
});

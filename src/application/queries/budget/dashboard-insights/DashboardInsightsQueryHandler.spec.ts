import {
  IDashboardInsightsDao,
  DashboardInsightsAggregates,
} from '@application/contracts/daos/budget/IDashboardInsightsDao';
import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { DashboardInsightsQueryHandler } from './DashboardInsightsQueryHandler';

describe('DashboardInsightsQueryHandler', () => {
  class DaoStub implements IDashboardInsightsDao {
    aggregates: DashboardInsightsAggregates = {
      monthlyFinancial: { incomeMonth: 0, expenseMonth: 0 },
      categorySpending: [],
      envelopeLimits: { totalMonthlyLimit: 0 },
      accountsBalance: { totalBalance: 0 },
      goals: [],
    };

    async fetchAggregates(): Promise<DashboardInsightsAggregates> {
      return this.aggregates;
    }
  }

  it('should throw error when budgetId is missing', async () => {
    const dao = new DaoStub();
    const handler = new DashboardInsightsQueryHandler(
      dao,
      new BudgetAuthorizationServiceStub(),
    );
    await expect(
      handler.execute({ budgetId: '', userId: 'u1' }),
    ).rejects.toThrow('INVALID_QUERY');
  });

  it('should throw error when userId is missing', async () => {
    const dao = new DaoStub();
    const handler = new DashboardInsightsQueryHandler(
      dao,
      new BudgetAuthorizationServiceStub(),
    );
    await expect(
      handler.execute({ budgetId: 'b1', userId: '' }),
    ).rejects.toThrow('INVALID_QUERY');
  });

  it('should return default structure with empty data', async () => {
    const dao = new DaoStub();
    const handler = new DashboardInsightsQueryHandler(
      dao,
      new BudgetAuthorizationServiceStub(),
    );
    const result = await handler.execute({ budgetId: 'b1', userId: 'u1' });

    expect(result).toHaveProperty('indicators');
    expect(result).toHaveProperty('suggestedActions');
    expect(result).toHaveProperty('recentAchievements');
    expect(result).toHaveProperty('categorySpending');
    expect(result.indicators.budgetUsage).toBeNull();
    expect(result.indicators.cashFlow).toBeNull();
    expect(result.indicators.goalsOnTrack).toBeNull();
    expect(result.indicators.emergencyReserve).toBeNull();
    expect(result.suggestedActions).toEqual([]);
    expect(result.recentAchievements).toEqual([]);
    expect(result.categorySpending).toEqual([]);
  });

  it('should calculate cashFlow with correct status', async () => {
    const dao = new DaoStub();
    dao.aggregates.monthlyFinancial = {
      incomeMonth: 11000,
      expenseMonth: 10000,
    };
    const handler = new DashboardInsightsQueryHandler(
      dao,
      new BudgetAuthorizationServiceStub(),
    );
    const result = await handler.execute({ budgetId: 'b1', userId: 'u1' });

    expect(result.indicators.cashFlow).not.toBeNull();
    expect(result.indicators.cashFlow?.ratio).toBe(110);
    expect(result.indicators.cashFlow?.absoluteValue).toBe(1000);
    expect(result.indicators.cashFlow?.status).toBe('healthy');
  });

  it('should calculate budgetUsage with envelopes', async () => {
    const dao = new DaoStub();
    dao.aggregates.monthlyFinancial = {
      incomeMonth: 10000,
      expenseMonth: 8000,
    };
    dao.aggregates.envelopeLimits = { totalMonthlyLimit: 10000 };
    const handler = new DashboardInsightsQueryHandler(
      dao,
      new BudgetAuthorizationServiceStub(),
    );
    const result = await handler.execute({ budgetId: 'b1', userId: 'u1' });

    expect(result.indicators.budgetUsage).not.toBeNull();
    expect(result.indicators.budgetUsage?.percentage).toBe(80);
    expect(result.indicators.budgetUsage?.status).toBe('healthy');
  });

  it('should generate suggested actions based on conditions', async () => {
    const dao = new DaoStub();
    dao.aggregates.monthlyFinancial = { incomeMonth: 5000, expenseMonth: 6000 };
    dao.aggregates.accountsBalance = { totalBalance: 5000 };
    const handler = new DashboardInsightsQueryHandler(
      dao,
      new BudgetAuthorizationServiceStub(),
    );
    const result = await handler.execute({ budgetId: 'b1', userId: 'u1' });

    expect(result.suggestedActions.length).toBeGreaterThan(0);
    expect(result.suggestedActions.length).toBeLessThanOrEqual(3);
  });
});

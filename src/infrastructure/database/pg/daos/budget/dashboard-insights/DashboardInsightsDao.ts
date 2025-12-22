import {
  IDashboardInsightsDao,
  DashboardInsightsAggregates,
} from '@application/contracts/daos/budget/IDashboardInsightsDao';
import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class DashboardInsightsDao implements IDashboardInsightsDao {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchAggregates(params: {
    budgetId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<DashboardInsightsAggregates> {
    return {
      monthlyFinancial: {
        incomeMonth: 0,
        expenseMonth: 0,
      },
      categorySpending: [],
      envelopeLimits: {
        totalMonthlyLimit: 0,
      },
      accountsBalance: {
        totalBalance: 0,
      },
      goals: [],
    };
  }
}

// [ ] DAO methods implemented
// [ ] Handler passes all tests
// [ ] Route registered
// [ ] NotFound path covered
// [ ] Derived totals correct
// [ ] No other files changed

import { IQueryHandler } from '../../shared/IQueryHandler';
import { IGetBudgetOverviewDao } from '@application/contracts/daos/budget/IGetBudgetOverviewDao';
import { BudgetNotFoundError } from '@application/shared/errors/BudgetNotFoundError';

export interface BudgetOverviewQuery {
  budgetId: string;
  userId: string;
}

export interface BudgetOverviewQueryResult {
  id: string;
  name: string;
  type: 'PERSONAL' | 'SHARED';
  participants: { id: string }[];
  totals: {
    accountsBalance: number;
    monthIncome: number;
    monthExpense: number;
    netMonth: number;
  };
  accounts: {
    id: string;
    name: string;
    type: string;
    balance: number;
  }[];
}

export class BudgetOverviewQueryHandler
  implements IQueryHandler<BudgetOverviewQuery, BudgetOverviewQueryResult>
{
  constructor(private readonly dao: IGetBudgetOverviewDao) {}

  async execute(
    query: BudgetOverviewQuery,
  ): Promise<BudgetOverviewQueryResult> {
    if (!query.budgetId || !query.userId) {
      throw new Error('INVALID_QUERY');
    }

    const budgetCore = await this.dao.fetchBudgetCore(
      query.budgetId,
      query.userId,
    );
    if (!budgetCore) throw new BudgetNotFoundError();

    const now = new Date();
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [participants, accounts, aggregates] = await Promise.all([
      this.dao.fetchParticipants(query.budgetId),
      this.dao.fetchAccounts(query.budgetId),
      this.dao.fetchMonthlyAggregates(query.budgetId, periodStart, periodEnd),
    ]);

    const accountsBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const monthIncome = aggregates.income;
    const monthExpense = aggregates.expense;
    const netMonth = monthIncome - monthExpense;

    return {
      id: budgetCore.id,
      name: budgetCore.name,
      type: budgetCore.type,
      participants,
      accounts,
      totals: {
        accountsBalance,
        monthIncome,
        monthExpense,
        netMonth,
      },
    };
  }
}

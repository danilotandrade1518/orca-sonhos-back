import { IGetBudgetOverviewDao } from '@application/contracts/daos/budget/IGetBudgetOverviewDao';
import { BudgetNotFoundError } from '@application/shared/errors/BudgetNotFoundError';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { InsufficientPermissionsError } from '@application/shared/errors/InsufficientPermissionsError';

import { IQueryHandler } from '../../shared/IQueryHandler';

export interface BudgetOverviewQuery {
  budgetId: string;
  userId: string;
}

export interface BudgetOverviewQueryResult {
  id: string;
  name: string;
  type: string;
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
  constructor(
    private readonly dao: IGetBudgetOverviewDao,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    query: BudgetOverviewQuery,
  ): Promise<BudgetOverviewQueryResult> {
    if (!query.budgetId || !query.userId) {
      throw new Error('INVALID_QUERY');
    }

    const auth = await this.budgetAuthorizationService.canAccessBudget(
      query.userId,
      query.budgetId,
    );
    if (auth.hasError) throw auth.errors[0];
    if (!auth.data) throw new InsufficientPermissionsError();

    const budgetCore = await this.dao.fetchBudgetCore({
      budgetId: query.budgetId,
    });
    if (!budgetCore) throw new BudgetNotFoundError();

    const now = new Date();
    const periodStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const [participants, accounts, aggregates] = await Promise.all([
      this.dao.fetchParticipants({ budgetId: query.budgetId }),
      this.dao.fetchAccounts({ budgetId: query.budgetId }),
      this.dao.fetchMonthlyAggregates({
        budgetId: query.budgetId,
        periodStart,
        periodEnd,
      }),
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

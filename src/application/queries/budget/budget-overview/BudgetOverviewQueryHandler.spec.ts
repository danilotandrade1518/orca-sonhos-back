import {
  IGetBudgetOverviewDao,
  BudgetAccount,
  BudgetCore,
  BudgetParticipant,
  MonthlyAggregates,
} from '@application/contracts/daos/budget/IGetBudgetOverviewDao';
import { BudgetNotFoundError } from '@application/shared/errors/BudgetNotFoundError';
import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { BudgetOverviewQueryHandler } from './BudgetOverviewQueryHandler';

describe('BudgetOverviewQueryHandler', () => {
  class DaoStub implements IGetBudgetOverviewDao {
    budget: BudgetCore | null = null;
    participants: BudgetParticipant[] = [];
    accounts: BudgetAccount[] = [];
    aggregates: MonthlyAggregates = { income: 0, expense: 0 };
    async fetchBudgetCore(): Promise<BudgetCore | null> {
      return this.budget;
    }
    async fetchParticipants(): Promise<BudgetParticipant[]> {
      return this.participants;
    }
    async fetchAccounts(): Promise<BudgetAccount[]> {
      return this.accounts;
    }
    async fetchMonthlyAggregates(): Promise<MonthlyAggregates> {
      return this.aggregates;
    }
  }

  it('should throw not found when budget inaccessible', async () => {
    const dao = new DaoStub();
    dao.budget = null;
    const handler = new BudgetOverviewQueryHandler(
      dao,
      new BudgetAuthorizationServiceStub(),
    );
    await expect(
      handler.execute({ budgetId: 'b1', userId: 'u1' }),
    ).rejects.toBeInstanceOf(BudgetNotFoundError);
  });

  it('should compute totals and map fields', async () => {
    const dao = new DaoStub();
    dao.budget = { id: 'b1', name: 'Main', type: 'PERSONAL' };
    dao.participants = [{ id: 'u1' }, { id: 'u2' }];
    dao.accounts = [
      { id: 'a1', name: 'A', type: 'CHECKING', balance: 1000 },
      { id: 'a2', name: 'B', type: 'SAVINGS', balance: 2000 },
    ];
    dao.aggregates = { income: 5000, expense: 3000 };

    const handler = new BudgetOverviewQueryHandler(
      dao,
      new BudgetAuthorizationServiceStub(),
    );
    const result = await handler.execute({ budgetId: 'b1', userId: 'u1' });

    expect(result).toEqual({
      id: 'b1',
      name: 'Main',
      type: 'PERSONAL',
      participants: [{ id: 'u1' }, { id: 'u2' }],
      accounts: dao.accounts,
      totals: {
        accountsBalance: 3000,
        monthIncome: 5000,
        monthExpense: 3000,
        netMonth: 2000,
      },
    });
  });
});

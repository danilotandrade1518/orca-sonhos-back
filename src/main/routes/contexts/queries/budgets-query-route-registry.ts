import { RouteDefinition } from '@http/server-adapter';
import { DefaultResponseBuilder } from '@http/builders/DefaultResponseBuilder';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';
import { AuthTokenInvalidError } from '@application/shared/errors/AuthTokenInvalidError';

import { ListBudgetsQueryHandler } from '@application/queries/budget/list-budgets/ListBudgetsQueryHandler';
import { BudgetOverviewQueryHandler } from '@application/queries/budget/budget-overview/BudgetOverviewQueryHandler';
import { DashboardInsightsQueryHandler } from '@application/queries/budget/dashboard-insights/DashboardInsightsQueryHandler';
import { MonthlyFinancialAnalysisQueryHandler } from '@application/queries/budget/monthly-financial-analysis/MonthlyFinancialAnalysisQueryHandler';

import { ListBudgetsDao } from '@infrastructure/database/pg/daos/budget/list-budgets/ListBudgetsDao';
import { BudgetOverviewDao } from '@infrastructure/database/pg/daos/budget/budget-overview/BudgetOverviewDao';
import { DashboardInsightsDao } from '@infrastructure/database/pg/daos/budget/dashboard-insights/DashboardInsightsDao';
import { MonthlyFinancialAnalysisDao } from '@infrastructure/database/pg/daos/budget/monthly-financial-analysis/MonthlyFinancialAnalysisDao';

import {
  queriesTotal,
  queryLatencyMs,
} from '@shared/observability/query-metrics';

export function buildBudgetQueryRoutes(params: {
  connection: IPostgresConnectionAdapter;
  auth: IBudgetAuthorizationService;
}): RouteDefinition[] {
  const budgetsDao = new ListBudgetsDao(params.connection);
  const overviewDao = new BudgetOverviewDao(params.connection);
  const dashboardInsightsDao = new DashboardInsightsDao(params.connection);
  const monthlyFinancialAnalysisDao = new MonthlyFinancialAnalysisDao(
    params.connection,
  );

  return [
    {
      method: 'GET',
      path: '/budgets',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'ListBudgets';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new ListBudgetsQueryHandler(budgetsDao);
            const includeDeleted =
              req.query.includeDeleted === 'true' ||
              req.query.includeDeleted === '1';
            const data = await handler.execute({
              userId: req.principal.userId,
              includeDeleted,
            });
            const res = DefaultResponseBuilder.ok(req.requestId, {
              data,
              meta: { count: data.length },
            });
            queriesTotal.labels(queryName, 'true', '200').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            return res;
          } catch (err) {
            queriesTotal.labels(queryName, 'false', '500').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            throw err;
          }
        },
      },
    },

    {
      method: 'GET',
      path: '/budget/:budgetId/overview',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'BudgetOverview';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new BudgetOverviewQueryHandler(
              overviewDao,
              params.auth,
            );
            const budgetId = req.params.budgetId;
            const data = await handler.execute({
              budgetId,
              userId: req.principal.userId,
            });
            const res = DefaultResponseBuilder.ok(req.requestId, { data });
            queriesTotal.labels(queryName, 'true', '200').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            return res;
          } catch (err) {
            queriesTotal.labels(queryName, 'false', '500').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            throw err;
          }
        },
      },
    },

    {
      method: 'GET',
      path: '/budget/:budgetId/dashboard/insights',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'DashboardInsights';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new DashboardInsightsQueryHandler(
              dashboardInsightsDao,
              params.auth,
            );
            const budgetId = req.params.budgetId;
            const data = await handler.execute({
              budgetId,
              userId: req.principal.userId,
            });
            const res = DefaultResponseBuilder.ok(req.requestId, { data });
            queriesTotal.labels(queryName, 'true', '200').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            return res;
          } catch (err) {
            queriesTotal.labels(queryName, 'false', '500').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            throw err;
          }
        },
      },
    },

    {
      method: 'GET',
      path: '/budget/:budgetId/monthly-analysis',
      controller: {
        handle: async (req) => {
          const start = Date.now();
          const queryName = 'MonthlyFinancialAnalysis';
          try {
            if (!req.principal) throw new AuthTokenInvalidError();
            const handler = new MonthlyFinancialAnalysisQueryHandler(
              monthlyFinancialAnalysisDao,
              params.auth,
            );
            const budgetId = req.params.budgetId;
            const data = await handler.execute({
              budgetId,
              userId: req.principal.userId,
            });
            const res = DefaultResponseBuilder.ok(req.requestId, { data });
            queriesTotal.labels(queryName, 'true', '200').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            return res;
          } catch (err) {
            queriesTotal.labels(queryName, 'false', '500').inc();
            queryLatencyMs.labels(queryName).observe(Date.now() - start);
            throw err;
          }
        },
      },
    },
  ];
}

import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetAccountRepositoryStub } from '@application/shared/tests/stubs/GetAccountRepositoryStub';
import { IReconcileAccountUnitOfWorkStub } from '@application/shared/tests/stubs/IReconcileAccountUnitOfWorkStub';
import { ReconcileAccountUseCase } from '@application/use-cases/account/reconcile-account/ReconcileAccountUseCase';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { ReconcileAccountController } from '@http/controllers/account/reconcile-account.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

const getRepoR = new GetAccountRepositoryStub();
const uowR = new IReconcileAccountUnitOfWorkStub();
const authR = new BudgetAuthorizationServiceStub();
authR.mockHasAccess = true;
const adjustmentCategoryId = EntityId.create().value!.id;

const accountResultR = Account.create({
  name: 'Conta Recon',
  type: AccountTypeEnum.CHECKING_ACCOUNT,
  budgetId: EntityId.create().value!.id,
  initialBalance: 100,
});
getRepoR.mockAccount = accountResultR.data!;

const reconcileUseCase = new ReconcileAccountUseCase(
  getRepoR,
  uowR,
  authR,
  adjustmentCategoryId,
);

describe('POST /accounts/reconcile (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  beforeAll(() => {
    const controller = new ReconcileAccountController(reconcileUseCase);
    register({ method: 'POST', path: '/accounts/reconcile', controller });
  });

  afterAll(async () => {
    await close();
  });

  it('should reconcile account and return 200', async () => {
    const res = await request(server.rawApp)
      .post('/accounts/reconcile')
      .send({
        userId: EntityId.create().value!.id,
        budgetId: getRepoR.mockAccount!.budgetId!,
        accountId: getRepoR.mockAccount!.id,
        realBalance: 150,
      })
      .expect(200);
    expect(res.body.id).toBe(getRepoR.mockAccount!.id);
    expect(res.body.traceId).toBeDefined();
  });

  it('should 404 when account not found', async () => {
    getRepoR.shouldReturnNull = true;
    const res = await request(server.rawApp)
      .post('/accounts/reconcile')
      .send({
        userId: EntityId.create().value!.id,
        budgetId: accountResultR.data!.budgetId!,
        accountId: 'missing',
        realBalance: 90,
      })
      .expect(404);
    expect(Array.isArray(res.body.errors)).toBe(true);
    getRepoR.shouldReturnNull = false;
  });
});

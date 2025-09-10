import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { CheckAccountDependenciesRepositoryStub } from '@application/shared/tests/stubs/CheckAccountDependenciesRepositoryStub';
import { DeleteAccountRepositoryStub } from '@application/shared/tests/stubs/DeleteAccountRepositoryStub';
import { GetAccountRepositoryStub } from '@application/shared/tests/stubs/GetAccountRepositoryStub';
import { DeleteAccountUseCase } from '@application/use-cases/account/delete-account/DeleteAccountUseCase';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { DeleteAccountController } from '@http/controllers/account/delete-account.controller';
import { RouteDefinition } from '@http/server-adapter';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

const getRepoD = new GetAccountRepositoryStub();
const deleteRepo = new DeleteAccountRepositoryStub();
const depsRepo = new CheckAccountDependenciesRepositoryStub();
const authD = new BudgetAuthorizationServiceStub();
authD.mockHasAccess = true;

const accountResultD = Account.create({
  name: 'Conta X',
  type: AccountTypeEnum.CHECKING_ACCOUNT,
  budgetId: EntityId.create().value!.id,
  initialBalance: 50,
});
getRepoD.mockAccount = accountResultD.data!;

const deleteUseCase = new DeleteAccountUseCase(
  getRepoD,
  deleteRepo,
  depsRepo,
  authD,
);

describe('DELETE /accounts (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  beforeAll(() => {
    const controller = new DeleteAccountController(deleteUseCase);
    const routes: RouteDefinition[] = [
      { method: 'DELETE', path: '/accounts', controller },
    ];
    register(...routes);
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete an account and return 200', async () => {
    const res = await request(server.rawApp)
      .delete('/accounts')
      .send({
        userId: EntityId.create().value!.id,
        accountId: getRepoD.mockAccount!.id,
      })
      .expect(200);
    expect(res.body.id).toBe(getRepoD.mockAccount!.id);
    expect(res.body.traceId).toBeDefined();
  });

  it('should 404 when account not found', async () => {
    jest.spyOn(getRepoD, 'execute').mockResolvedValueOnce(Either.success(null));

    const res = await request(server.rawApp)
      .delete('/accounts')
      .send({
        userId: EntityId.create().value!.id,
        accountId: 'missing',
      })
      .expect(404);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

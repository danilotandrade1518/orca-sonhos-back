import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetAccountRepositoryStub } from '@application/shared/tests/stubs/GetAccountRepositoryStub';
import { ITransferBetweenAccountsUnitOfWorkStub } from '@application/shared/tests/stubs/ITransferBetweenAccountsUnitOfWorkStub';
import { TransferBetweenAccountsUseCase } from '@application/use-cases/account/transfer-between-accounts/TransferBetweenAccountsUseCase';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { TransferBetweenAccountsController } from '@http/controllers/account/transfer-between-accounts.controller';
import { RouteDefinition } from '@http/server-adapter';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

const getRepoT = new GetAccountRepositoryStub();
const uowT = new ITransferBetweenAccountsUnitOfWorkStub();
const authT = new BudgetAuthorizationServiceStub();
authT.mockHasAccess = true;
const transferCategoryId = EntityId.create().value!.id;

const budgetIdT = EntityId.create().value!.id;
const fromAccount = Account.create({
  name: 'Origem',
  type: AccountTypeEnum.CHECKING_ACCOUNT,
  budgetId: budgetIdT,
  initialBalance: 300,
}).data!;
const toAccount = Account.create({
  name: 'Destino',
  type: AccountTypeEnum.SAVINGS_ACCOUNT,
  budgetId: budgetIdT,
  initialBalance: 100,
}).data!;

jest.spyOn(getRepoT, 'execute').mockImplementation(async (id: string) => {
  getRepoT.executeCalls.push(id);
  if (id === fromAccount.id) return Either.success(fromAccount);
  if (id === toAccount.id) return Either.success(toAccount);
  return Either.success(null);
});

const transferUseCase = new TransferBetweenAccountsUseCase(
  getRepoT,
  uowT,
  authT,
  transferCategoryId,
);

describe('POST /accounts/transfer (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  beforeAll(() => {
    const controller = new TransferBetweenAccountsController(transferUseCase);
    const routes: RouteDefinition[] = [
      { method: 'POST', path: '/accounts/transfer', controller },
    ];
    register(...routes);
  });

  afterAll(async () => {
    await close();
  });

  it('should transfer between accounts and return 200', async () => {
    const res = await request(server.rawApp)
      .post('/accounts/transfer')
      .send({
        userId: EntityId.create().value!.id,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: 50,
        description: 'Transfer test',
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should return 404 when origin account missing', async () => {
    const res = await request(server.rawApp)
      .post('/accounts/transfer')
      .send({
        userId: EntityId.create().value!.id,
        fromAccountId: 'missing',
        toAccountId: toAccount.id,
        amount: 10,
      })
      .expect(404);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});

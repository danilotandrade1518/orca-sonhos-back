import { AddAccountRepositoryStub } from '@application/shared/tests/stubs/AddAccountRepositoryStub';
import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { CreateAccountUseCase } from '@application/use-cases/account/create-account/CreateAccountUseCase';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { CreateAccountController } from '@http/controllers/account/create-account.controller';
import { RouteDefinition } from '@http/server-adapter';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

describe('POST /accounts (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  beforeAll(() => {
    const repo = new AddAccountRepositoryStub();
    const auth = new BudgetAuthorizationServiceStub();
    auth.mockHasAccess = true;
    const useCase = new CreateAccountUseCase(repo, auth);
    const controller = new CreateAccountController(useCase);
    const routes: RouteDefinition[] = [
      { method: 'POST', path: '/accounts', controller },
    ];
    register(...routes);
  });

  afterAll(async () => {
    await close();
  });

  it('should create an account and return 201 with id and traceId', async () => {
    const res = await request(server.rawApp)
      .post('/accounts')
      .send({
        userId: EntityId.create().value!.id,
        name: 'Conta Corrente',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: EntityId.create().value!.id,
        initialBalance: 500,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map domain errors to 400 (invalid name)', async () => {
    const res = await request(server.rawApp)
      .post('/accounts')
      .send({
        userId: EntityId.create().value!.id,
        name: '',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: EntityId.create().value!.id,
      })
      .expect(400);

    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.traceId).toBeDefined();
  });
});

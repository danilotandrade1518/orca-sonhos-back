import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetAccountRepositoryStub } from '@application/shared/tests/stubs/GetAccountRepositoryStub';
import { SaveAccountRepositoryStub } from '@application/shared/tests/stubs/SaveAccountRepositoryStub';
import { UpdateAccountUseCase } from '@application/use-cases/account/update-account/UpdateAccountUseCase';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { UpdateAccountController } from '@http/controllers/account/update-account.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

const getRepo = new GetAccountRepositoryStub();
const saveRepo = new SaveAccountRepositoryStub();
const auth = new BudgetAuthorizationServiceStub();
auth.mockHasAccess = true;

const budgetId = EntityId.create().value!.id;
const accountResult = Account.create({
  name: 'Original',
  type: AccountTypeEnum.CHECKING_ACCOUNT,
  budgetId,
  initialBalance: 100,
});
getRepo.mockAccount = accountResult.data!;

const useCase = new UpdateAccountUseCase(getRepo, saveRepo, auth);

describe('PATCH /accounts (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  beforeAll(() => {
    const controller = new UpdateAccountController(useCase);
    register({ method: 'PATCH', path: '/accounts', controller });
  });

  afterAll(async () => {
    await close();
  });

  it('should update an account and return 200', async () => {
    const res = await request(server.rawApp)
      .patch('/accounts')
      .send({
        id: getRepo.mockAccount!.id,
        userId: EntityId.create().value!.id,
        name: 'Nova Conta',
      })
      .expect(200);
    expect(res.body.id).toBe(getRepo.mockAccount!.id);
    expect(res.body.traceId).toBeDefined();
  });

  it('should 404 when account not found', async () => {
    getRepo.shouldReturnNull = true;
    const res = await request(server.rawApp)
      .patch('/accounts')
      .send({
        id: 'missing',
        userId: EntityId.create().value!.id,
        name: 'qualquer',
      })
      .expect(404);
    expect(Array.isArray(res.body.errors)).toBe(true);
    getRepo.shouldReturnNull = false;
  });
});

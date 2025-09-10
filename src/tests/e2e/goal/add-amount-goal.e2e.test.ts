import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetAccountRepositoryStub } from '@application/shared/tests/stubs/GetAccountRepositoryStub';
import { GetGoalByIdRepositoryStub } from '@application/shared/tests/stubs/GetGoalByIdRepositoryStub';
import { GetGoalsByAccountRepositoryStub } from '@application/shared/tests/stubs/GetGoalsByAccountRepositoryStub';
import { SaveGoalRepositoryStub } from '@application/shared/tests/stubs/SaveGoalRepositoryStub';
import { AddAmountToGoalUseCase } from '@application/use-cases/goal/add-amount-to-goal/AddAmountToGoalUseCase';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { AddAmountGoalController } from '@http/controllers/goal/add-amount-goal.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

const budgetId = EntityId.create().value!.id;

function makeGoal(sourceAccountId: string): Goal {
  const id = EntityId.create().value!.id;
  const env: Partial<Goal> & {
    id: string;
    budgetId: string;
    sourceAccountId: string;
  } = {
    id,
    budgetId,
    sourceAccountId,
    addAmount: () => Either.success(undefined),
  };
  return env as Goal;
}

describe('PATCH /goals/amount (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const account = Account.create({
    name: 'Conta X',
    type: AccountTypeEnum.CHECKING_ACCOUNT,
    budgetId,
    initialBalance: 50,
  }).data!;
  const getAccountRepo = new GetAccountRepositoryStub();
  getAccountRepo.mockAccount = account;

  const goal = makeGoal(account.id);
  const getRepo = new GetGoalByIdRepositoryStub();
  getRepo.mockGoal = goal;

  // TODO: Fix constructor - need 5 parameters
  const useCase = new AddAmountToGoalUseCase(
    getRepo,
    getAccountRepo,
    new GetGoalsByAccountRepositoryStub(),
    new SaveGoalRepositoryStub(),
    new BudgetAuthorizationServiceStub(),
  );
  const controller = new AddAmountGoalController(useCase);

  beforeAll(() => {
    register({ method: 'PATCH', path: '/goals/amount', controller });
  });
  afterAll(async () => {
    await close();
  });

  it('should add amount 200', async () => {
    const res = await request(server.rawApp)
      .patch('/goals/amount')
      .send({
        id: goal.id,
        amount: 150,
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map errors', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .patch('/goals/amount')
      .send({
        id: EntityId.create().value!.id,
        amount: 10,
      })
      .expect(400);
  });
});

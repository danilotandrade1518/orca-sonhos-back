import { GetCreditCardBillRepositoryStub } from '@application/shared/tests/stubs/GetCreditCardBillRepositoryStub';
import { SaveCreditCardBillRepositoryStub } from '@application/shared/tests/stubs/SaveCreditCardBillRepositoryStub';
import { UpdateCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/update-credit-card-bill/UpdateCreditCardBillUseCase';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { UpdateCreditCardBillController } from '@http/controllers/credit-card-bill/update-credit-card-bill.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

function makeBill(): CreditCardBill {
  const id = EntityId.create().value!.id;
  const bill: Partial<CreditCardBill> & { id: string; creditCardId: string } = {
    id,
    creditCardId: EntityId.create().value!.id,
    update: () => Either.success(undefined),
  };
  return bill as CreditCardBill;
}

describe('PUT /credit-card-bills (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const creditCardBill = makeBill();
  const getRepo = new GetCreditCardBillRepositoryStub();
  getRepo.mockCreditCardBill = creditCardBill;

  const saveRepo = new SaveCreditCardBillRepositoryStub();
  const useCase = new UpdateCreditCardBillUseCase(getRepo, saveRepo);
  const controller = new UpdateCreditCardBillController(useCase);

  beforeAll(() => {
    register({ method: 'PUT', path: '/credit-card-bills', controller });
  });
  afterAll(async () => close());

  it('should update credit card bill 200', async () => {
    const res = await request(server.rawApp)
      .put('/credit-card-bills')
      .send({
        id: creditCardBill.id,
        closingDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        amount: 999,
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .put('/credit-card-bills')
      .send({
        id: EntityId.create().value!.id,
        closingDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        amount: 200,
      })
      .expect(400);
  });
});

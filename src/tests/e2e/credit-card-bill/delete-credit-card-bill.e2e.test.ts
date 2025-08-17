import { DeleteCreditCardBillRepositoryStub } from '@application/shared/tests/stubs/DeleteCreditCardBillRepositoryStub';
import { GetCreditCardBillRepositoryStub } from '@application/shared/tests/stubs/GetCreditCardBillRepositoryStub';
import { DeleteCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/delete-credit-card-bill/DeleteCreditCardBillUseCase';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { DeleteCreditCardBillController } from '@http/controllers/credit-card-bill/delete-credit-card-bill.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

function makeBill(): CreditCardBill {
  const id = EntityId.create().value!.id;
  const bill: Partial<CreditCardBill> & { id: string; creditCardId: string } = {
    id,
    creditCardId: EntityId.create().value!.id,
    delete: () => Either.success(undefined),
  };
  return bill as CreditCardBill;
}

describe('DELETE /credit-card-bills (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const creditCardBill = makeBill();
  const getRepo = new GetCreditCardBillRepositoryStub();
  getRepo.mockCreditCardBill = creditCardBill;

  const delRepo = new DeleteCreditCardBillRepositoryStub();
  const useCase = new DeleteCreditCardBillUseCase(getRepo, delRepo);
  const controller = new DeleteCreditCardBillController(useCase);

  beforeAll(() => {
    register({ method: 'DELETE', path: '/credit-card-bills', controller });
  });
  afterAll(async () => close());

  it('should delete credit card bill 200', async () => {
    const res = await request(server.rawApp)
      .delete('/credit-card-bills')
      .send({ id: creditCardBill.id })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .delete('/credit-card-bills')
      .send({ id: EntityId.create().value!.id })
      .expect(400);
  });
});

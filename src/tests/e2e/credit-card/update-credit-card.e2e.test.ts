import { GetCreditCardRepositoryStub } from '@application/shared/tests/stubs/GetCreditCardRepositoryStub';
import { SaveCreditCardRepositoryStub } from '@application/shared/tests/stubs/SaveCreditCardRepositoryStub';
import { UpdateCreditCardUseCase } from '@application/use-cases/credit-card/update-credit-card/UpdateCreditCardUseCase';
import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { UpdateCreditCardController } from '@http/controllers/credit-card/update-credit-card.controller';
import request from 'supertest';

import { createHttpTestServer } from '../support/http-test-server';

function makeCard(): CreditCard {
  const id = EntityId.create().value!.id;
  const card: Partial<CreditCard> & { id: string } = {
    id,
    update: () => Either.success(undefined),
  };
  return card as CreditCard;
}

describe('PUT /credit-cards (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const creditCard = makeCard();
  const getRepo = new GetCreditCardRepositoryStub();
  getRepo.mockCreditCard = creditCard;

  const saveRepo = new SaveCreditCardRepositoryStub();
  const useCase = new UpdateCreditCardUseCase(getRepo, saveRepo);
  const controller = new UpdateCreditCardController(useCase);

  beforeAll(() => {
    register({ method: 'PUT', path: '/credit-cards', controller });
  });
  afterAll(async () => close());

  it('should update 200', async () => {
    const res = await request(server.rawApp)
      .put('/credit-cards')
      .send({
        id: creditCard.id,
        name: 'Novo Nome',
        limit: 6000,
        closingDay: 12,
        dueDay: 22,
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map repo error', async () => {
    getRepo.shouldFail = true;
    await request(server.rawApp)
      .put('/credit-cards')
      .send({
        id: EntityId.create().value!.id,
        name: 'X',
        limit: 1000,
        closingDay: 5,
        dueDay: 15,
      })
      .expect(400);
  });
});

import { GetCreditCardBillRepositoryStub } from '@application/shared/tests/stubs/GetCreditCardBillRepositoryStub';
import { GetCreditCardRepositoryStub } from '@application/shared/tests/stubs/GetCreditCardRepositoryStub';
import { SaveCreditCardBillRepositoryStub } from '@application/shared/tests/stubs/SaveCreditCardBillRepositoryStub';
import { ReopenCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/reopen-bill/ReopenCreditCardBillUseCase';
import {
  CreditCardBill,
  RestoreCreditCardBillDTO,
} from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { ReopenCreditCardBillController } from '@http/controllers/credit-card-bill/reopen-credit-card-bill.controller';
import request from 'supertest';
import { MockBudgetAuthorizationService } from './../../integration/setup/mock-budget-authorization-service';

import { createHttpTestServer } from '../support/http-test-server';

function restoreBill(
  status: BillStatusEnum = BillStatusEnum.PAID,
): CreditCardBill {
  const data: RestoreCreditCardBillDTO = {
    id: EntityId.create().value!.id,
    creditCardId: EntityId.create().value!.id,
    closingDate: new Date('2025-01-10'),
    dueDate: new Date('2025-01-25'),
    amount: 50000,
    status,
    paidAt: status === BillStatusEnum.PAID ? new Date() : undefined,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return CreditCardBill.restore(data).data!;
}

function createCard(budgetId: string): CreditCard {
  const result = CreditCard.create({
    name: 'Card',
    limit: 100000,
    closingDay: 10,
    dueDay: 25,
    budgetId,
  });
  if (result.hasError) throw new Error('invalid card');
  return result.data!;
}

describe('POST /credit-card-bills/reopen (E2E)', () => {
  const { server, register, close } = createHttpTestServer();

  const bill = restoreBill();
  const getBillRepo = new GetCreditCardBillRepositoryStub();
  getBillRepo.mockCreditCardBill = bill;

  const card = createCard(bill.creditCardId);
  const getCardRepo = new GetCreditCardRepositoryStub();
  getCardRepo.mockCreditCard = card;

  const saveBillRepo = new SaveCreditCardBillRepositoryStub();
  const authService = new MockBudgetAuthorizationService();
  const useCase = new ReopenCreditCardBillUseCase(
    getBillRepo,
    saveBillRepo,
    getCardRepo,
    authService,
  );
  const controller = new ReopenCreditCardBillController(useCase);

  beforeAll(() => {
    register({ method: 'POST', path: '/credit-card-bills/reopen', controller });
  });
  afterAll(async () => close());

  it('should reopen bill 200', async () => {
    const res = await request(server.rawApp)
      .post('/credit-card-bills/reopen')
      .send({
        creditCardBillId: bill.id,
        userId: EntityId.create().value!.id,
        budgetId: card.budgetId,
        justification: 'Need adjust',
      })
      .expect(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('should map save repository error', async () => {
    saveBillRepo.shouldFail = true;
    await request(server.rawApp)
      .post('/credit-card-bills/reopen')
      .send({
        creditCardBillId: bill.id,
        userId: EntityId.create().value!.id,
        budgetId: card.budgetId,
        justification: 'Need adjust',
      })
      .expect(400);
  });
});

import { CreditCardBillNotFoundError } from '@application/shared/errors/CreditCardBillNotFoundError';
import { InsufficientPermissionsError } from '@application/shared/errors/InsufficientPermissionsError';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetCreditCardBillRepositoryStub } from '@application/shared/tests/stubs/GetCreditCardBillRepositoryStub';
import { GetCreditCardRepositoryStub } from '@application/shared/tests/stubs/GetCreditCardRepositoryStub';
import { SaveCreditCardBillRepositoryStub } from '@application/shared/tests/stubs/SaveCreditCardBillRepositoryStub';
import {
  CreditCardBill,
  RestoreCreditCardBillDTO,
} from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { BillStatusEnum } from '@domain/aggregates/credit-card-bill/value-objects/bill-status/BillStatus';
import { CreditCard } from '@domain/aggregates/credit-card/credit-card-entity/CreditCard';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { ReopenCreditCardBillDto } from './ReopenCreditCardBillDto';
import { ReopenCreditCardBillUseCase } from './ReopenCreditCardBillUseCase';

const makeBill = (): CreditCardBill => {
  const data: RestoreCreditCardBillDTO = {
    id: EntityId.create().value!.id,
    creditCardId: EntityId.create().value!.id,
    closingDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-20'),
    amount: 1000,
    status: BillStatusEnum.PAID,
    paidAt: new Date(),
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = CreditCardBill.restore(data);
  if (result.hasError) throw new Error('invalid test bill');
  return result.data!;
};

const makeCard = (budgetId: string): CreditCard => {
  const result = CreditCard.create({
    name: 'Card',
    limit: 2000,
    closingDay: 10,
    dueDay: 20,
    budgetId,
  });
  return result.data!;
};

describe('ReopenCreditCardBillUseCase', () => {
  let useCase: ReopenCreditCardBillUseCase;
  let getBillRepo: GetCreditCardBillRepositoryStub;
  let saveBillRepo: SaveCreditCardBillRepositoryStub;
  let getCardRepo: GetCreditCardRepositoryStub;
  let authService: BudgetAuthorizationServiceStub;
  const userId = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;

  beforeEach(() => {
    getBillRepo = new GetCreditCardBillRepositoryStub();
    saveBillRepo = new SaveCreditCardBillRepositoryStub();
    getCardRepo = new GetCreditCardRepositoryStub();
    authService = new BudgetAuthorizationServiceStub();
    useCase = new ReopenCreditCardBillUseCase(
      getBillRepo,
      saveBillRepo,
      getCardRepo,
      authService,
    );
  });

  it('deve reabrir fatura com sucesso', async () => {
    const bill = makeBill();
    getBillRepo.setCreditCardBill(bill);
    const card = makeCard(budgetId);
    getCardRepo.setCreditCard(card);

    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: bill.id,
      justification: 'Pagamento duplicado',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(false);
    expect(saveBillRepo.executeCalls[0]).toBe(bill);
  });

  it('deve retornar erro se fatura não encontrada', async () => {
    getBillRepo.setCreditCardBill(null);

    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: 'any',
      justification: 'teste',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new CreditCardBillNotFoundError());
  });

  it('deve retornar erro se usuário não tem acesso', async () => {
    const bill = makeBill();
    getBillRepo.setCreditCardBill(bill);
    const card = makeCard('other-budget');
    jest.spyOn(getCardRepo, 'execute').mockResolvedValue(Either.success(card));
    authService.mockHasAccess = false;

    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: bill.id,
      justification: 'x'.repeat(15),
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(CreditCardBillNotFoundError);
  });

  it('deve retornar erro quando get bill repository falha', async () => {
    const repositoryError = new RepositoryError('Database connection failed');
    jest
      .spyOn(getBillRepo, 'execute')
      .mockResolvedValue(Either.error(repositoryError));

    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: 'any-id',
      justification: 'test',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBe(repositoryError);
  });

  it('deve retornar erro quando cartão não é encontrado', async () => {
    const bill = makeBill();
    getBillRepo.setCreditCardBill(bill);
    getCardRepo.setCreditCard(null);

    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: bill.id,
      justification: 'test',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(CreditCardBillNotFoundError);
  });

  it('deve retornar erro quando get card repository falha', async () => {
    const bill = makeBill();
    getBillRepo.setCreditCardBill(bill);

    const repositoryError = new RepositoryError('Database error');
    jest
      .spyOn(getCardRepo, 'execute')
      .mockResolvedValue(Either.error(repositoryError));

    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: bill.id,
      justification: 'test',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBe(repositoryError);
  });

  it('deve retornar erro quando authorization service falha', async () => {
    const bill = makeBill();
    getBillRepo.setCreditCardBill(bill);
    const card = makeCard(budgetId);
    getCardRepo.setCreditCard(card);

    authService.shouldFail = true;

    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: bill.id,
      justification: 'test',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
  });

  it('deve retornar erro quando usuário não tem permissões suficientes', async () => {
    const bill = makeBill();
    getBillRepo.setCreditCardBill(bill);
    const card = makeCard(budgetId);
    getCardRepo.setCreditCard(card);
    authService.mockHasAccess = false;

    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: bill.id,
      justification: 'test',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
  });

  it('deve retornar erro quando bill.reopen() falha', async () => {
    const data: RestoreCreditCardBillDTO = {
      id: EntityId.create().value!.id,
      creditCardId: EntityId.create().value!.id,
      closingDate: new Date('2024-01-01'),
      dueDate: new Date('2024-01-20'),
      amount: 1000,
      status: BillStatusEnum.OPEN,
      paidAt: undefined,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const openBill = CreditCardBill.restore(data).data!;

    getBillRepo.setCreditCardBill(openBill);
    const card = makeCard(budgetId);
    getCardRepo.setCreditCard(card);
    authService.mockHasAccess = true;

    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: openBill.id,
      justification: 'test',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
  });

  it('deve retornar erro quando save bill repository falha', async () => {
    const bill = makeBill();
    getBillRepo.setCreditCardBill(bill);
    const card = makeCard(budgetId);
    getCardRepo.setCreditCard(card);
    authService.mockHasAccess = true;

    const repositoryError = new RepositoryError('Failed to save bill');
    jest
      .spyOn(saveBillRepo, 'execute')
      .mockResolvedValue(Either.error(repositoryError));

    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: bill.id,
      justification: 'test',
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBe(repositoryError);
  });

  it('deve reabrir fatura com justificativa longa', async () => {
    const bill = makeBill();
    getBillRepo.setCreditCardBill(bill);
    const card = makeCard(budgetId);
    getCardRepo.setCreditCard(card);
    authService.mockHasAccess = true;

    const longJustification = 'x'.repeat(500);
    const dto: ReopenCreditCardBillDto = {
      userId,
      budgetId,
      creditCardBillId: bill.id,
      justification: longJustification,
    };

    const result = await useCase.execute(dto);
    expect(result.hasError).toBe(false);
    expect(result.data).toEqual({ id: bill.id });
  });
});

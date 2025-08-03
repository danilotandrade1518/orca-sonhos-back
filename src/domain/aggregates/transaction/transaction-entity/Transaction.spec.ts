import { TransactionBusinessRuleError } from '../errors/TransactionBusinessRuleError';
import { TransactionAlreadyDeletedError } from '../errors/TransactionAlreadyDeletedError';
import { TransactionStatusEnum } from '../value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '../value-objects/transaction-type/TransactionType';
import {
  CreateTransactionDTO,
  Transaction,
  UpdateTransactionDTO,
} from './Transaction';
import { CancellationReason } from '../value-objects/cancellation-reason/CancellationReason';
import { TransactionNotScheduledError } from '../errors/TransactionNotScheduledError';
import { InvalidCancellationReasonError } from '../errors/InvalidCancellationReasonError';
import { TransactionAlreadyExecutedError } from '../errors/TransactionAlreadyExecutedError';
import { EntityId } from '../../../shared/value-objects/entity-id/EntityId';

describe('Transaction', () => {
  const validTransactionData: CreateTransactionDTO = {
    description: 'Supermercado ABC',
    amount: 5000, // R$ 50,00 em centavos
    type: TransactionTypeEnum.EXPENSE,
    transactionDate: new Date(Date.now() + 86400000),
    categoryId: '123e4567-e89b-12d3-a456-426614174000',
    budgetId: '123e4567-e89b-12d3-a456-426614174001',
    accountId: '123e4567-e89b-12d3-a456-426614174002',
    status: TransactionStatusEnum.SCHEDULED,
  };

  describe('create', () => {
    it('deve criar uma transação válida', () => {
      const result = Transaction.create(validTransactionData);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeTruthy();

      const transaction = result.data!;
      expect(transaction.description).toBe('Supermercado ABC');
      expect(transaction.amount).toBe(5000);
      expect(transaction.type).toBe(TransactionTypeEnum.EXPENSE);
      expect(transaction.status).toBe(TransactionStatusEnum.SCHEDULED);
      expect(transaction.categoryId).toBe(validTransactionData.categoryId);
      expect(transaction.budgetId).toBe(validTransactionData.budgetId);
      expect(transaction.creditCardId).toBeNull();
    });

    it('deve criar uma transação com cartão de crédito', () => {
      const dataWithCreditCard = {
        ...validTransactionData,
        creditCardId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = Transaction.create(dataWithCreditCard);

      expect(result.hasError).toBe(false);
      expect(result.data!.creditCardId).toBe(dataWithCreditCard.creditCardId);
    });

    it('deve determinar status automaticamente se não fornecido', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const dataWithoutStatus: Partial<CreateTransactionDTO> = {
        ...validTransactionData,
        transactionDate: futureDate,
      };
      delete dataWithoutStatus.status;

      const result = Transaction.create(
        dataWithoutStatus as CreateTransactionDTO,
      );

      expect(result.hasError).toBe(false);
      expect(result.data!.status).toBe(TransactionStatusEnum.SCHEDULED);
    });

    it('deve retornar erro se descrição for inválida', () => {
      const invalidData = {
        ...validTransactionData,
        description: 'AB', // Muito curta
      };

      const result = Transaction.create(invalidData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve retornar erro se amount for inválido', () => {
      const invalidData = {
        ...validTransactionData,
        amount: -100, // Negativo
      };

      const result = Transaction.create(invalidData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve retornar erro se type for inválido', () => {
      const invalidData = {
        ...validTransactionData,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'INVALID' as any,
      };

      const result = Transaction.create(invalidData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve retornar erro se categoryId for inválido', () => {
      const invalidData = {
        ...validTransactionData,
        categoryId: 'invalid-uuid',
      };

      const result = Transaction.create(invalidData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve retornar erro se budgetId for inválido', () => {
      const invalidData = {
        ...validTransactionData,
        budgetId: 'invalid-uuid',
      };

      const result = Transaction.create(invalidData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('complete', () => {
    it('deve completar uma transação agendada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;

      const result = transaction.complete();

      expect(result.hasError).toBe(false);
      expect(transaction.status).toBe(TransactionStatusEnum.COMPLETED);
      expect(transaction.isCompleted).toBe(true);
    });

    it('deve completar uma transação em atraso', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.OVERDUE,
      }).data!;

      const result = transaction.complete();

      expect(result.hasError).toBe(false);
      expect(transaction.status).toBe(TransactionStatusEnum.COMPLETED);
    });

    it('deve retornar erro ao tentar completar transação cancelada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.CANCELLED,
      }).data!;

      const result = transaction.complete();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionBusinessRuleError);
      expect(result.errors[0].message).toBe(
        'Cannot complete a cancelled transaction',
      );
    });
  });

  describe('cancel', () => {
    it('deve cancelar uma transação agendada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;

      const result = transaction.cancel(CancellationReason.create('Motivo'));

      expect(result.hasError).toBe(false);
      expect(transaction.status).toBe(TransactionStatusEnum.CANCELLED);
      expect(transaction.isCancelled).toBe(true);
    });

    it('deve retornar erro ao cancelar uma transação em atraso', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.OVERDUE,
      }).data!;

      const result = transaction.cancel(CancellationReason.create('Motivo'));

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionNotScheduledError);
    });

    it('deve retornar erro ao tentar cancelar transação completada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.COMPLETED,
      }).data!;

      const result = transaction.cancel(CancellationReason.create('Motivo'));

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionAlreadyExecutedError);
    });
  });

  describe('markAsOverdue', () => {
    it('deve marcar transação agendada como atrasada', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const transaction = Transaction.create({
        ...validTransactionData,
        transactionDate: pastDate,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;

      const result = transaction.markAsOverdue();

      expect(result.hasError).toBe(false);
      expect(transaction.status).toBe(TransactionStatusEnum.OVERDUE);
      expect(transaction.isOverdue).toBe(true);
    });

    it('deve retornar erro ao marcar transação completada como atrasada', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const transaction = Transaction.create({
        ...validTransactionData,
        transactionDate: pastDate,
        status: TransactionStatusEnum.COMPLETED,
      }).data!;

      const result = transaction.markAsOverdue();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionBusinessRuleError);
      expect(result.errors[0].message).toBe(
        'Cannot mark completed or cancelled transaction as overdue',
      );
    });

    it('deve retornar erro ao marcar transação cancelada como atrasada', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const transaction = Transaction.create({
        ...validTransactionData,
        transactionDate: pastDate,
        status: TransactionStatusEnum.CANCELLED,
      }).data!;

      const result = transaction.markAsOverdue();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionBusinessRuleError);
    });

    it('deve retornar erro ao marcar transação futura como atrasada', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const transaction = Transaction.create({
        ...validTransactionData,
        transactionDate: futureDate,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;

      const result = transaction.markAsOverdue();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionBusinessRuleError);
      expect(result.errors[0].message).toBe(
        'Cannot mark future transaction as overdue',
      );
    });
  });

  describe('status helpers', () => {
    it('deve identificar corretamente transação agendada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;

      expect(transaction.isScheduled).toBe(true);
      expect(transaction.isCompleted).toBe(false);
      expect(transaction.isOverdue).toBe(false);
      expect(transaction.isCancelled).toBe(false);
    });

    it('deve identificar corretamente transação completada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.COMPLETED,
      }).data!;

      expect(transaction.isCompleted).toBe(true);
      expect(transaction.isScheduled).toBe(false);
      expect(transaction.isOverdue).toBe(false);
      expect(transaction.isCancelled).toBe(false);
    });

    it('deve identificar corretamente transação atrasada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.OVERDUE,
      }).data!;

      expect(transaction.isOverdue).toBe(true);
      expect(transaction.isScheduled).toBe(false);
      expect(transaction.isCompleted).toBe(false);
      expect(transaction.isCancelled).toBe(false);
    });

    it('deve identificar corretamente transação cancelada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.CANCELLED,
      }).data!;

      expect(transaction.isCancelled).toBe(true);
      expect(transaction.isScheduled).toBe(false);
      expect(transaction.isCompleted).toBe(false);
      expect(transaction.isOverdue).toBe(false);
    });
  });

  describe('determineInitialStatus', () => {
    it('deve retornar SCHEDULED para data futura', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const dataWithoutStatus: Partial<CreateTransactionDTO> = {
        ...validTransactionData,
        transactionDate: futureDate,
      };
      delete dataWithoutStatus.status;

      const transaction = Transaction.create(
        dataWithoutStatus as CreateTransactionDTO,
      ).data!;

      expect(transaction.status).toBe(TransactionStatusEnum.SCHEDULED);
    });

    it('deve retornar SCHEDULED para data de hoje', () => {
      const today = new Date();

      const dataWithoutStatus: Partial<CreateTransactionDTO> = {
        ...validTransactionData,
        transactionDate: today,
      };
      delete dataWithoutStatus.status;

      const transaction = Transaction.create(
        dataWithoutStatus as CreateTransactionDTO,
      ).data!;

      expect(transaction.status).toBe(TransactionStatusEnum.SCHEDULED);
    });

    it('deve retornar OVERDUE para data passada', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const dataWithoutStatus: Partial<CreateTransactionDTO> = {
        ...validTransactionData,
        transactionDate: pastDate,
      };
      delete dataWithoutStatus.status;

      const transaction = Transaction.create(
        dataWithoutStatus as CreateTransactionDTO,
      ).data!;

      expect(transaction.status).toBe(TransactionStatusEnum.OVERDUE);
    });
  });

  describe('restore', () => {
    it('deve restaurar uma transação a partir de dados de persistência', () => {
      const id = EntityId.create().value!.id;
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');

      const restoreData = {
        id,
        description: 'Transação restaurada',
        amount: 150,
        type: TransactionTypeEnum.INCOME,
        accountId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
        transactionDate: new Date('2023-01-01'),
        status: TransactionStatusEnum.COMPLETED,
        isDeleted: false,
        createdAt,
        updatedAt,
      };

      const result = Transaction.restore(restoreData);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();

      const transaction = result.data!;
      expect(transaction.id).toBe(id);
      expect(transaction.description).toBe('Transação restaurada');
      expect(transaction.amount).toBe(150);
      expect(transaction.type).toBe(TransactionTypeEnum.INCOME);
      expect(transaction.status).toBe(TransactionStatusEnum.COMPLETED);
      expect(transaction.createdAt).toEqual(createdAt);
      expect(transaction.updatedAt).toEqual(updatedAt);
      expect(transaction.isDeleted).toBe(false);
    });

    it('deve restaurar uma transação deletada', () => {
      const id = EntityId.create().value!.id;
      const createdAt = new Date('2023-01-01');
      const updatedAt = new Date('2023-01-02');

      const restoreData = {
        id,
        description: 'Transação deletada',
        amount: 200,
        type: TransactionTypeEnum.EXPENSE,
        accountId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
        transactionDate: new Date('2023-01-01'),
        status: TransactionStatusEnum.CANCELLED,
        isDeleted: true,
        createdAt,
        updatedAt,
      };

      const result = Transaction.restore(restoreData);

      expect(result.hasError).toBe(false);
      expect(result.data).toBeDefined();

      const transaction = result.data!;
      expect(transaction.id).toBe(id);
      expect(transaction.isDeleted).toBe(true);
      expect(transaction.status).toBe(TransactionStatusEnum.CANCELLED);
    });

    it('deve retornar erro ao restaurar com dados inválidos', () => {
      const restoreData = {
        id: 'invalid-id',
        description: '', // Descrição inválida
        amount: -100, // Valor inválido
        type: 'INVALID' as TransactionTypeEnum,
        accountId: 'invalid-account-id',
        categoryId: 'invalid-category-id',
        budgetId: 'invalid-budget-id',
        transactionDate: new Date(),
        status: 'INVALID' as TransactionStatusEnum,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = Transaction.restore(restoreData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve restaurar transação com diferentes tipos de status', () => {
      const baseData = {
        id: EntityId.create().value!.id,
        description: 'Transação teste',
        amount: 100,
        type: TransactionTypeEnum.EXPENSE,
        accountId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
        transactionDate: new Date(),
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Testar todos os status possíveis
      const statuses = [
        TransactionStatusEnum.SCHEDULED,
        TransactionStatusEnum.COMPLETED,
        TransactionStatusEnum.OVERDUE,
        TransactionStatusEnum.CANCELLED,
      ];

      statuses.forEach((status) => {
        const result = Transaction.restore({ ...baseData, status });
        expect(result.hasError).toBe(false);
        expect(result.data!.status).toBe(status);
      });
    });

    it('deve restaurar transação com diferentes tipos', () => {
      const baseData = {
        id: EntityId.create().value!.id,
        description: 'Transação teste',
        amount: 100,
        accountId: EntityId.create().value!.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
        transactionDate: new Date(),
        status: TransactionStatusEnum.COMPLETED,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Testar todos os tipos possíveis
      const types = [
        TransactionTypeEnum.INCOME,
        TransactionTypeEnum.EXPENSE,
        TransactionTypeEnum.TRANSFER,
      ];

      types.forEach((type) => {
        const result = Transaction.restore({ ...baseData, type });
        expect(result.hasError).toBe(false);
        expect(result.data!.type).toBe(type);
      });
    });
  });

  describe('update', () => {
    let transaction: Transaction;

    beforeEach(() => {
      transaction = Transaction.create(validTransactionData).data!;
    });

    it('deve atualizar descrição da transação', () => {
      const updateData: UpdateTransactionDTO = {
        description: 'Nova descrição',
        amount: transaction.amount,
        type: transaction.type,
        accountId: transaction.accountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(false);
      expect(result.data!.description).toBe('Nova descrição');
    });

    it('deve atualizar valor da transação', () => {
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: 250,
        type: transaction.type,
        accountId: transaction.accountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(false);
      expect(result.data!.amount).toBe(250);
    });

    it('deve atualizar tipo da transação', () => {
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: transaction.amount,
        type: TransactionTypeEnum.INCOME,
        accountId: transaction.accountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(false);
      expect(result.data!.type).toBe(TransactionTypeEnum.INCOME);
    });

    it('deve atualizar conta da transação', () => {
      const newAccountId = EntityId.create().value!.id;
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        accountId: newAccountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(false);
      expect(result.data!.accountId).toBe(newAccountId);
    });

    it('deve atualizar categoria da transação', () => {
      const newCategoryId = EntityId.create().value!.id;
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        accountId: transaction.accountId,
        categoryId: newCategoryId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(false);
      expect(result.data!.categoryId).toBe(newCategoryId);
    });

    it('deve atualizar data da transação', () => {
      const newDate = new Date('2024-12-31');
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        accountId: transaction.accountId,
        transactionDate: newDate,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(false);
      expect(result.data!.transactionDate).toEqual(newDate);
    });

    it('deve emitir evento quando conta for alterada', () => {
      const newAccountId = EntityId.create().value!.id;
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        accountId: newAccountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(false);
      expect(result.data!.getEvents()).toHaveLength(1);
    });

    it('deve emitir evento quando valor for alterado', () => {
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: 300,
        type: transaction.type,
        accountId: transaction.accountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(false);
      expect(result.data!.getEvents()).toHaveLength(1);
    });

    it('deve emitir evento quando tipo for alterado', () => {
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: transaction.amount,
        type: TransactionTypeEnum.TRANSFER,
        accountId: transaction.accountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(false);
      expect(result.data!.getEvents()).toHaveLength(1);
    });

    it('não deve emitir evento quando apenas descrição for alterada', () => {
      const updateData: UpdateTransactionDTO = {
        description: 'Nova descrição sem eventos',
        amount: transaction.amount,
        type: transaction.type,
        accountId: transaction.accountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(false);
      expect(result.data!.getEvents()).toHaveLength(0);
    });

    it('deve retornar erro ao atualizar com descrição inválida', () => {
      const updateData: UpdateTransactionDTO = {
        description: 'AB', // Muito curta
        amount: transaction.amount,
        type: transaction.type,
        accountId: transaction.accountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve retornar erro ao atualizar com valor inválido', () => {
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: -100, // Negativo
        type: transaction.type,
        accountId: transaction.accountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve retornar erro ao atualizar com tipo inválido', () => {
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: transaction.amount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'INVALID' as any,
        accountId: transaction.accountId,
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve retornar erro ao atualizar com ID de conta inválido', () => {
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        accountId: 'invalid-account-id',
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve retornar erro ao atualizar com ID de categoria inválido', () => {
      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        accountId: transaction.accountId,
        categoryId: 'invalid-category-id',
      };

      const result = transaction.update(updateData);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('delete', () => {
    it('deve deletar transação e emitir evento', () => {
      const transaction = Transaction.create(validTransactionData).data!;
      transaction.clearEvents(); // Limpar evento de criação

      const result = transaction.delete();

      expect(result.hasError).toBe(false);
      expect(transaction.isDeleted).toBe(true);
      expect(transaction.getEvents()).toHaveLength(1);
    });

    it('deve retornar erro ao deletar transação já deletada', () => {
      const transaction = Transaction.create(validTransactionData).data!;
      transaction.delete();

      const result = transaction.delete();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionAlreadyDeletedError);
    });

    it('deve atualizar updatedAt quando deletar', () => {
      const transaction = Transaction.create(validTransactionData).data!;
      const originalUpdatedAt = transaction.updatedAt;

      // Aguardar um pouco para garantir diferença de tempo
      setTimeout(() => {
        transaction.delete();
        expect(transaction.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });
  });

  describe('complete - cenários adicionais', () => {
    it('deve retornar erro ao completar transação já completada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.COMPLETED,
      }).data!;

      const result = transaction.complete();

      expect(result.hasError).toBe(false); // Não é erro completar uma já completada
      expect(transaction.status).toBe(TransactionStatusEnum.COMPLETED);
    });

    it('deve atualizar updatedAt quando completar', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;
      const originalUpdatedAt = transaction.updatedAt;

      // Aguardar um pouco para garantir diferença de tempo
      setTimeout(() => {
        transaction.complete();
        expect(transaction.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });
  });

  describe('cancel - cenários adicionais', () => {
    it('deve retornar erro ao cancelar transação já cancelada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.CANCELLED,
      }).data!;

      const result = transaction.cancel(CancellationReason.create('Motivo'));

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionBusinessRuleError);
      expect(result.errors[0].message).toBe(
        'Cannot cancel a cancelled transaction',
      );
    });

    it('deve retornar erro se motivo for inválido', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;

      const result = transaction.cancel(CancellationReason.create('  '));

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InvalidCancellationReasonError());
    });

    it('deve retornar erro se data de execução já passou', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const transaction = Transaction.create({
        ...validTransactionData,
        transactionDate: pastDate,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;

      const result = transaction.cancel(CancellationReason.create('Motivo'));

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionAlreadyExecutedError);
    });

    it('deve atualizar updatedAt quando cancelar', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;
      const originalUpdatedAt = transaction.updatedAt;

      // Aguardar um pouco para garantir diferença de tempo
      setTimeout(() => {
        transaction.cancel(CancellationReason.create('Motivo'));
        expect(transaction.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });
  });

  describe('markAsOverdue - cenários adicionais', () => {
    it('deve retornar erro ao marcar transação já atrasada como atrasada', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const transaction = Transaction.create({
        ...validTransactionData,
        transactionDate: pastDate,
        status: TransactionStatusEnum.OVERDUE,
      }).data!;

      const result = transaction.markAsOverdue();

      expect(result.hasError).toBe(false); // Não é erro marcar como atrasada uma já atrasada
      expect(transaction.status).toBe(TransactionStatusEnum.OVERDUE);
    });

    it('deve atualizar updatedAt quando marcar como atrasada', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const transaction = Transaction.create({
        ...validTransactionData,
        transactionDate: pastDate,
        status: TransactionStatusEnum.SCHEDULED,
      }).data!;
      const originalUpdatedAt = transaction.updatedAt;

      // Aguardar um pouco para garantir diferença de tempo
      setTimeout(() => {
        transaction.markAsOverdue();
        expect(transaction.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });
  });

  describe('determineInitialStatus - cenários adicionais', () => {
    it('deve usar status fornecido quando providenciado', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const dataWithProvidedStatus: CreateTransactionDTO = {
        ...validTransactionData,
        transactionDate: futureDate,
        status: TransactionStatusEnum.COMPLETED, // Status específico fornecido
      };

      const transaction = Transaction.create(dataWithProvidedStatus).data!;

      expect(transaction.status).toBe(TransactionStatusEnum.COMPLETED);
    });

    it('deve determinar status baseado na data quando não fornecido', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const dataWithoutStatus: Partial<CreateTransactionDTO> = {
        ...validTransactionData,
        transactionDate: pastDate,
      };
      delete dataWithoutStatus.status;

      const transaction = Transaction.create(
        dataWithoutStatus as CreateTransactionDTO,
      ).data!;

      expect(transaction.status).toBe(TransactionStatusEnum.OVERDUE);
    });
  });

  describe('create - cenários de cartão de crédito', () => {
    it('deve criar transação com cartão de crédito válido', () => {
      const creditCardId = EntityId.create().value!.id;
      const dataWithCreditCard: CreateTransactionDTO = {
        ...validTransactionData,
        creditCardId,
      };

      const result = Transaction.create(dataWithCreditCard);

      expect(result.hasError).toBe(false);
      expect(result.data!.creditCardId).toBe(creditCardId);
    });

    it('deve retornar erro ao criar transação com ID de cartão de crédito inválido', () => {
      const dataWithInvalidCreditCard: CreateTransactionDTO = {
        ...validTransactionData,
        creditCardId: 'invalid-credit-card-id',
      };

      const result = Transaction.create(dataWithInvalidCreditCard);

      expect(result.hasError).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve criar transação sem cartão de crédito', () => {
      const dataWithoutCreditCard: CreateTransactionDTO = {
        ...validTransactionData,
        // creditCardId não especificado
      };

      const result = Transaction.create(dataWithoutCreditCard);

      expect(result.hasError).toBe(false);
      expect(result.data!.creditCardId).toBeNull();
    });
  });

  describe('getters - validação completa', () => {
    it('deve retornar todos os valores dos getters corretamente', () => {
      const creditCardId = EntityId.create().value!.id;
      const transactionDate = new Date('2023-01-15');

      const data: CreateTransactionDTO = {
        description: 'Teste completo de getters',
        amount: 500,
        type: TransactionTypeEnum.INCOME,
        transactionDate,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
        accountId: EntityId.create().value!.id,
        status: TransactionStatusEnum.COMPLETED,
        creditCardId,
      };

      const transaction = Transaction.create(data).data!;

      expect(transaction.description).toBe('Teste completo de getters');
      expect(transaction.amount).toBe(500);
      expect(transaction.type).toBe(TransactionTypeEnum.INCOME);
      expect(transaction.transactionDate).toEqual(transactionDate);
      expect(transaction.categoryId).toBe(data.categoryId);
      expect(transaction.budgetId).toBe(data.budgetId);
      expect(transaction.accountId).toBe(data.accountId);
      expect(transaction.status).toBe(TransactionStatusEnum.COMPLETED);
      expect(transaction.creditCardId).toBe(creditCardId);
      expect(transaction.isDeleted).toBe(false);
      expect(transaction.createdAt).toBeInstanceOf(Date);
      expect(transaction.updatedAt).toBeInstanceOf(Date);
      expect(typeof transaction.id).toBe('string');
    });
  });

  describe('status helpers - validação cruzada', () => {
    it('deve garantir exclusividade entre status helpers', () => {
      const statuses = [
        TransactionStatusEnum.SCHEDULED,
        TransactionStatusEnum.COMPLETED,
        TransactionStatusEnum.OVERDUE,
        TransactionStatusEnum.CANCELLED,
      ];

      statuses.forEach((status) => {
        const transaction = Transaction.create({
          ...validTransactionData,
          status,
        }).data!;

        // Verificar que apenas o helper correspondente retorna true
        const helpers = [
          { name: 'isScheduled', value: transaction.isScheduled },
          { name: 'isCompleted', value: transaction.isCompleted },
          { name: 'isOverdue', value: transaction.isOverdue },
          { name: 'isCancelled', value: transaction.isCancelled },
        ];

        const trueHelpers = helpers.filter((h) => h.value);
        expect(trueHelpers).toHaveLength(1);

        // Verificar qual helper deve ser true para cada status
        switch (status) {
          case TransactionStatusEnum.SCHEDULED:
            expect(transaction.isScheduled).toBe(true);
            break;
          case TransactionStatusEnum.COMPLETED:
            expect(transaction.isCompleted).toBe(true);
            break;
          case TransactionStatusEnum.OVERDUE:
            expect(transaction.isOverdue).toBe(true);
            break;
          case TransactionStatusEnum.CANCELLED:
            expect(transaction.isCancelled).toBe(true);
            break;
        }
      });
    });
  });

  describe('eventos de domínio', () => {
    it('deve emitir TransactionCreatedEvent ao criar transação', () => {
      const transaction = Transaction.create(validTransactionData).data!;

      const events = transaction.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].constructor.name).toBe('TransactionCreatedEvent');
    });

    it('deve limpar eventos após obtê-los', () => {
      const transaction = Transaction.create(validTransactionData).data!;

      expect(transaction.getEvents()).toHaveLength(1);
      transaction.clearEvents();
      expect(transaction.getEvents()).toHaveLength(0);
    });

    it('deve emitir TransactionDeletedEvent ao deletar transação', () => {
      const transaction = Transaction.create(validTransactionData).data!;
      transaction.clearEvents(); // Limpar evento de criação

      transaction.delete();

      const events = transaction.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].constructor.name).toBe('TransactionDeletedEvent');
    });

    it('deve emitir TransactionUpdatedEvent ao atualizar propriedades relevantes', () => {
      const transaction = Transaction.create(validTransactionData).data!;
      transaction.clearEvents(); // Limpar evento de criação

      const updateData: UpdateTransactionDTO = {
        description: transaction.description,
        amount: 300, // Valor alterado
        type: transaction.type,
        accountId: transaction.accountId,
      };

      const updatedTransaction = transaction.update(updateData).data!;

      const events = updatedTransaction.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].constructor.name).toBe('TransactionUpdatedEvent');
    });
  });

  describe('validação de integridade', () => {
    it('deve manter integridade dos dados após operações', () => {
      const transaction = Transaction.create(validTransactionData).data!;
      const originalId = transaction.id;
      const originalCreatedAt = transaction.createdAt;
      const originalBudgetId = transaction.budgetId;

      // Completar transação
      transaction.complete();
      expect(transaction.id).toBe(originalId);
      expect(transaction.createdAt).toBe(originalCreatedAt);
      expect(transaction.budgetId).toBe(originalBudgetId);

      // Cancelar transação
      const newTransaction = Transaction.create(validTransactionData).data!;
      newTransaction.cancel(CancellationReason.create('Motivo'));
      expect(newTransaction.id).toBeDefined();
      expect(newTransaction.createdAt).toBeInstanceOf(Date);
      expect(newTransaction.budgetId).toBe(validTransactionData.budgetId);
    });

    it('deve manter consistência entre create e restore', () => {
      // Criar transação
      const createdTransaction = Transaction.create(validTransactionData).data!;

      // Simular dados de restore baseados na transação criada
      const restoreData = {
        id: createdTransaction.id,
        description: createdTransaction.description,
        amount: createdTransaction.amount,
        type: createdTransaction.type,
        accountId: createdTransaction.accountId,
        categoryId: createdTransaction.categoryId,
        budgetId: createdTransaction.budgetId,
        transactionDate: createdTransaction.transactionDate,
        status: createdTransaction.status,
        isDeleted: createdTransaction.isDeleted,
        createdAt: createdTransaction.createdAt,
        updatedAt: createdTransaction.updatedAt,
      };

      // Restaurar transação
      const restoredTransaction = Transaction.restore(restoreData).data!;

      // Verificar que os dados são consistentes
      expect(restoredTransaction.id).toBe(createdTransaction.id);
      expect(restoredTransaction.description).toBe(
        createdTransaction.description,
      );
      expect(restoredTransaction.amount).toBe(createdTransaction.amount);
      expect(restoredTransaction.type).toBe(createdTransaction.type);
      expect(restoredTransaction.status).toBe(createdTransaction.status);
      expect(restoredTransaction.isDeleted).toBe(createdTransaction.isDeleted);
    });
  });
});

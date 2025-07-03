import { TransactionBusinessRuleError } from '../errors/TransactionBusinessRuleError';
import { TransactionStatusEnum } from '../value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '../value-objects/transaction-type/TransactionType';
import { CreateTransactionDTO, Transaction } from './Transaction';

describe('Transaction', () => {
  const validTransactionData: CreateTransactionDTO = {
    description: 'Supermercado ABC',
    amount: 5000, // R$ 50,00 em centavos
    type: TransactionTypeEnum.EXPENSE,
    transactionDate: new Date('2024-01-15'),
    categoryId: '123e4567-e89b-12d3-a456-426614174000',
    budgetId: '123e4567-e89b-12d3-a456-426614174001',
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

      const result = transaction.cancel();

      expect(result.hasError).toBe(false);
      expect(transaction.status).toBe(TransactionStatusEnum.CANCELLED);
      expect(transaction.isCancelled).toBe(true);
    });

    it('deve cancelar uma transação em atraso', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.OVERDUE,
      }).data!;

      const result = transaction.cancel();

      expect(result.hasError).toBe(false);
      expect(transaction.status).toBe(TransactionStatusEnum.CANCELLED);
    });

    it('deve retornar erro ao tentar cancelar transação completada', () => {
      const transaction = Transaction.create({
        ...validTransactionData,
        status: TransactionStatusEnum.COMPLETED,
      }).data!;

      const result = transaction.cancel();

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(TransactionBusinessRuleError);
      expect(result.errors[0].message).toBe(
        'Cannot cancel a completed transaction',
      );
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
});

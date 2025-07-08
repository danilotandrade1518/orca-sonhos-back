import { DomainError } from '../../../shared/DomainError';

export class InvalidBillStatusError extends DomainError {
  constructor(value: unknown) {
    super(
      `Status de fatura inválido: ${value}. Status válidos: open, closed, paid, overdue`,
    );
    this.name = 'InvalidBillStatusError';
  }
}

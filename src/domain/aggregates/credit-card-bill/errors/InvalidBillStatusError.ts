import { DomainError } from '../../../shared/domain-error';

export class InvalidBillStatusError extends DomainError {
  constructor(value: unknown) {
    super(
      `Status de fatura inválido: ${value}. Status válidos: open, closed, paid, overdue`,
    );
    this.name = 'InvalidBillStatusError';
  }
}

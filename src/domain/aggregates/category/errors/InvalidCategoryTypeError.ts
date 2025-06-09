import { DomainError } from '../../../shared/domain-error';

export class InvalidCategoryTypeError extends DomainError {
  constructor() {
    super('CategoryType is invalid');
    this.name = 'InvalidCategoryTypeError';
  }
}

import { DomainError } from '../../../shared/DomainError';

export class InvalidCategoryTypeError extends DomainError {
  constructor() {
    super('CategoryType is invalid');
    this.name = 'InvalidCategoryTypeError';
  }
}

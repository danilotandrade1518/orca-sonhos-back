import { DomainError } from '../../../shared/DomainError';

export class DeletedAccountError extends DomainError {
  constructor() {
    super('Operation not permitted on deleted account');
    this.name = 'DeletedAccountError';
  }
}

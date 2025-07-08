import { DomainError } from '../DomainError';

export class CannotRemoveOwnerFromParticipantsError extends DomainError {
  constructor() {
    super('Cannot remove the owner from participants');
    this.name = 'CannotRemoveOwnerFromParticipantsError';
    this.fieldName = 'ownerId';
  }
}

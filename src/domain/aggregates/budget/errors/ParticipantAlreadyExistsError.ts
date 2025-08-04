import { DomainError } from '../../../shared/DomainError';

export class ParticipantAlreadyExistsError extends DomainError {
  constructor(participantId: string) {
    super(`Participant ${participantId} is already part of this budget`);
    this.name = 'ParticipantAlreadyExistsError';
  }
}

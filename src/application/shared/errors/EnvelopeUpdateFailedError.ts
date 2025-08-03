import { ApplicationError } from './ApplicationError';

export class EnvelopeUpdateFailedError extends ApplicationError {
  constructor(message: string) {
    super(message);
  }
}

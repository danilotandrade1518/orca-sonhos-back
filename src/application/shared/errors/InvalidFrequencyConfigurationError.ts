import { ApplicationError } from './ApplicationError';

export class InvalidFrequencyConfigurationError extends ApplicationError {
  constructor() {
    super('Invalid frequency configuration');
  }
}

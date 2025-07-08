import { DomainError } from './DomainError';

export interface IValueObject<T = unknown> {
  value: T | null;
  hasError: boolean;
  errors: DomainError[];
  equals(vo: this): boolean;
}

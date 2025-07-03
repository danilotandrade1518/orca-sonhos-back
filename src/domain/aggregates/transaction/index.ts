// Entidade principal
export {
  Transaction,
  CreateTransactionDTO,
} from './transaction-entity/Transaction';

// Value Objects
export {
  TransactionType,
  TransactionTypeEnum,
} from './value-objects/transaction-type/TransactionType';
export {
  TransactionStatus,
  TransactionStatusEnum,
} from './value-objects/transaction-status/TransactionStatus';
export { TransactionDescription } from './value-objects/transaction-description/TransactionDescription';

// Errors
export { InvalidTransactionTypeError } from './errors/InvalidTransactionTypeError';
export { InvalidTransactionStatusError } from './errors/InvalidTransactionStatusError';
export { InvalidTransactionDescriptionError } from './errors/InvalidTransactionDescriptionError';
export { TransactionBusinessRuleError } from './errors/TransactionBusinessRuleError';

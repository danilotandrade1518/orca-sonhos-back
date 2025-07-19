import { Account } from '@domain/aggregates/account/account-entity/Account';
import { DomainError } from '@domain/shared/DomainError';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { Either } from '@either';

export interface AccountRow {
  id: string;
  name: string;
  type: string;
  budget_id: string;
  balance: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class AccountMapper {
  static toDomain(row: AccountRow): Either<DomainError, Account> {
    return Account.restore({
      id: row.id,
      name: row.name,
      type: row.type as AccountTypeEnum,
      budgetId: row.budget_id,
      balance: parseFloat(row.balance),
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toRow(account: Account): AccountRow {
    return {
      id: account.id,
      name: account.name!,
      type: account.type as string,
      budget_id: account.budgetId!,
      balance: (account.balance ?? 0).toString(),
      is_deleted: account.isDeleted,
      created_at: account.createdAt,
      updated_at: account.updatedAt,
    };
  }
}

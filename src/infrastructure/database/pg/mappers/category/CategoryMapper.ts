import { Category } from '@domain/aggregates/category/category-entity/Category';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface CategoryRow {
  id: string;
  name: string;
  type: CategoryTypeEnum;
  budget_id: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class CategoryMapper {
  static toDomain(row: CategoryRow): Either<DomainError, Category> {
    return Category.restore({
      id: row.id,
      name: row.name,
      type: row.type,
      budgetId: row.budget_id,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toRow(category: Category): CategoryRow {
    return {
      id: category.id,
      name: category.name,
      type: category.type!,
      budget_id: category.budgetId,
      is_deleted: category.isDeleted,
      created_at: category.createdAt,
      updated_at: category.updatedAt,
    };
  }
}

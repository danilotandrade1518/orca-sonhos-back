import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';

export interface CreateCategoryDto {
  name: string;
  type: CategoryTypeEnum;
  budgetId: string;
}

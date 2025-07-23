import { CategoryTypeEnum } from '../../../../domain/aggregates/category/value-objects/category-type/CategoryType';

export interface UpdateCategoryDto {
  id: string;
  name: string;
  type: CategoryTypeEnum;
}

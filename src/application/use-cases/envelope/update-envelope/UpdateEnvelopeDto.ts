export interface UpdateEnvelopeDto {
  userId: string;
  budgetId: string;
  envelopeId: string;
  name?: string;
  description?: string;
  monthlyAllocation?: number;
  associatedCategories?: string[];
  color?: string;
  icon?: string;
}

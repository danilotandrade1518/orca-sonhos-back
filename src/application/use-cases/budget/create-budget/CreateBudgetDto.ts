export interface CreateBudgetDto {
  name: string;
  ownerId: string;
  participantIds?: string[];
}

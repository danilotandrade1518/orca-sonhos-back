export interface UpdateAccountDto {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  initialBalance?: number;
}

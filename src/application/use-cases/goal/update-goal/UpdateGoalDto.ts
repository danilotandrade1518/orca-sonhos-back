export interface UpdateGoalDto {
  id: string;
  name: string;
  totalAmount: number;
  deadline?: Date;
}

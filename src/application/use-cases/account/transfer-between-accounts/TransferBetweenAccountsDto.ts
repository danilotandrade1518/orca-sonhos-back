export interface TransferBetweenAccountsDto {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

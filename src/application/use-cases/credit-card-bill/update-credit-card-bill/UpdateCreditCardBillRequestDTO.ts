export interface UpdateCreditCardBillRequestDTO {
  id: string;
  closingDate: Date;
  dueDate: Date;
  amount: number;
}

export interface UpdateCreditCardBillResponseDTO {
  id: string;
  creditCardId: string;
  closingDate: Date;
  dueDate: Date;
  amount: number;
  status: string;
  updatedAt: Date;
}

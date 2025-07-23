export interface CreateCreditCardBillRequestDTO {
  creditCardId: string;
  closingDate: Date;
  dueDate: Date;
  amount: number;
}

export interface CreateCreditCardBillResponseDTO {
  id: string;
  creditCardId: string;
  closingDate: Date;
  dueDate: Date;
  amount: number;
  status: string;
  createdAt: Date;
}

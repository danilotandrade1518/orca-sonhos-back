export interface MarkCreditCardBillAsPaidRequestDTO {
  billId: string;
  accountId: string;
  paymentAmount: number;
  paymentDate: Date;
}

export interface MarkCreditCardBillAsPaidResponseDTO {
  id: string;
  paidAt: Date;
  status: string;
}

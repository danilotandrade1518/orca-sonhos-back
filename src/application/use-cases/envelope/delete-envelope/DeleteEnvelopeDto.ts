export interface DeleteEnvelopeDto {
  userId: string;
  budgetId: string;
  envelopeId: string;
  forceDelete?: boolean;
}

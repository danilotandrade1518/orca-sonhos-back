import { UseCaseResponse } from './UseCaseResponse';

export class ResponseBuilder {
  static success(id: string): UseCaseResponse {
    return {
      success: true,
      id,
    };
  }

  static failure(errors: string[]): UseCaseResponse {
    return {
      success: false,
      errors,
    };
  }
}

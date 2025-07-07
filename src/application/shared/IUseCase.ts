import { UseCaseResponse } from './UseCaseResponse';

export interface IUseCase<TRequest, TResponse extends UseCaseResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

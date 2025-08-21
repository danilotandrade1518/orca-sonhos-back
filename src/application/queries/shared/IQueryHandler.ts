export interface IQueryHandler<I, O> {
  execute(input: I): Promise<O>;
}

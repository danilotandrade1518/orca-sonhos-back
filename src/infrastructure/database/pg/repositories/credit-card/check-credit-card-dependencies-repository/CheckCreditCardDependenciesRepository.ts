import { ICheckCreditCardDependenciesRepository } from '@application/contracts/repositories/credit-card/ICheckCreditCardDependenciesRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class CheckCreditCardDependenciesRepository
  implements ICheckCreditCardDependenciesRepository
{
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(
    creditCardId: string,
  ): Promise<Either<RepositoryError, boolean>> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM credit_card_bills
          WHERE credit_card_id = $1 AND is_deleted = false
        ) as has_dependencies
      `;

      const result = await this.connection.queryOne<{
        has_dependencies: boolean;
      }>(query, [creditCardId]);

      return Either.success<RepositoryError, boolean>(
        result?.has_dependencies || false,
      );
    } catch (error) {
      return Either.error(
        new RepositoryError(
          `Failed to check credit card dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}

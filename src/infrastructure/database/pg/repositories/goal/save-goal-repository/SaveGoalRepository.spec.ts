import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { SaveGoalRepository } from './SaveGoalRepository';
import { AddGoalRepository } from '../add-goal-repository/AddGoalRepository';

describe('SaveGoalRepository', () => {
  let repository: SaveGoalRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(() => {
    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
    };

    repository = new SaveGoalRepository(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createValidGoal = async (): Promise<Goal> => {
    // Mock automático para o INSERT do AddGoalRepository
    mockConnection.query.mockResolvedValueOnce({
      rows: [{ rowCount: 1 }],
      rowCount: 1,
    });

    const goal = Goal.create({
      name: 'Test Goal',
      totalAmount: 100000,
      budgetId: EntityId.create().value!.id,
      sourceAccountId: EntityId.create().value!.id,
      accumulatedAmount: 25000,
    }).data!;

    const addGoalRepository = new AddGoalRepository(mockConnection);
    await addGoalRepository.execute(goal);

    return goal;
  };

  describe('execute', () => {
    it('should save goal successfully', async () => {
      const goal = await createValidGoal();
      goal.addAmount(15000);

      // Mock para o UPDATE do SaveGoalRepository
      mockConnection.query.mockResolvedValueOnce({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        expect.arrayContaining([
          goal.id,
          'Test Goal',
          100000,
          40000, // 25000 + 15000
          null, // deadline
          goal.budgetId,
          goal.sourceAccountId,
          false, // is_deleted
          goal.updatedAt,
        ]),
      );
    });

    it('should call UPDATE with correct SQL structure', async () => {
      const goal = await createValidGoal();

      // Mock para o UPDATE do SaveGoalRepository
      mockConnection.query.mockResolvedValueOnce({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      await repository.execute(goal);

      // Pega a segunda chamada (a primeira é o INSERT, a segunda é o UPDATE)
      const [query, params] = mockConnection.query.mock.calls[1];
      expect(query).toContain('UPDATE goals');
      expect(query).toContain('name = $2');
      expect(query).toContain('total_amount = $3');
      expect(query).toContain('accumulated_amount = $4');
      expect(query).toContain('deadline = $5');
      expect(query).toContain('budget_id = $6');
      expect(query).toContain('source_account_id = $7');
      expect(query).toContain('is_deleted = $8');
      expect(query).toContain('updated_at = $9');
      expect(query).toContain('WHERE id = $1');
      expect(params).toHaveLength(9);
    });

    it('should handle goal with deadline', async () => {
      const deadline = new Date('2025-12-31');
      const goal = Goal.create({
        name: 'Vacation Goal',
        totalAmount: 50000,
        budgetId: EntityId.create().value!.id,
        sourceAccountId: EntityId.create().value!.id,
        deadline,
        accumulatedAmount: 10000,
      }).data!;

      mockConnection.query.mockResolvedValueOnce({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        expect.arrayContaining([deadline]),
      );
    });

    it('should handle deleted goal', async () => {
      const goal = await createValidGoal();
      goal.delete();

      // Mock para o UPDATE do SaveGoalRepository
      mockConnection.query.mockResolvedValueOnce({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        expect.arrayContaining([true]), // is_deleted = true
      );
    });

    it('should handle goal with amount addition', async () => {
      const goal = await createValidGoal();
      goal.addAmount(25000);

      // Mock para o UPDATE do SaveGoalRepository
      mockConnection.query.mockResolvedValueOnce({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        expect.arrayContaining([50000]), // 25000 + 25000
      );
    });

    it('should handle goal with amount change', async () => {
      const goal = await createValidGoal();
      goal.addAmount(25000);

      // Mock para o UPDATE do SaveGoalRepository
      mockConnection.query.mockResolvedValueOnce({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        expect.arrayContaining([50000]), // 25000 + 25000
      );
    });

    it('should return error when goal not found', async () => {
      const goal = await createValidGoal();

      // Mock para o UPDATE do SaveGoalRepository retornando 0 linhas
      mockConnection.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Goal with id');
      expect(result.errors[0].message).toContain('not found for update');
      expect(result.errors[0].message).toContain(goal.id);
    });

    it('should return error when query returns null', async () => {
      const goal = await createValidGoal();

      // Mock para o UPDATE do SaveGoalRepository retornando null
      mockConnection.query.mockResolvedValueOnce(null);

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('not found for update');
    });

    it('should return error when database fails', async () => {
      const goal = await createValidGoal();

      const dbError = new Error('Database connection failed');
      // Mock para o UPDATE do SaveGoalRepository lançando erro
      mockConnection.query.mockRejectedValueOnce(dbError);

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to save goal');
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should handle goal with future deadline', async () => {
      const futureDate = new Date('2026-12-31');
      const goal = Goal.create({
        name: 'Future Goal',
        totalAmount: 200000,
        budgetId: EntityId.create().value!.id,
        sourceAccountId: EntityId.create().value!.id,
        deadline: futureDate,
        accumulatedAmount: 50000,
      }).data!;

      mockConnection.query.mockResolvedValueOnce({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        expect.arrayContaining([futureDate]),
      );
    });

    it('should handle goal amount additions correctly', async () => {
      const goal = await createValidGoal();

      // Add amount twice
      goal.addAmount(5000);
      expect(goal.accumulatedAmount).toBe(30000);

      goal.addAmount(10000);
      expect(goal.accumulatedAmount).toBe(40000);

      // Mock para o UPDATE do SaveGoalRepository
      mockConnection.query.mockResolvedValueOnce({
        rows: [{ rowCount: 1 }],
        rowCount: 1,
      });

      const result = await repository.execute(goal);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        expect.arrayContaining([40000]),
      );
    });
  });
});

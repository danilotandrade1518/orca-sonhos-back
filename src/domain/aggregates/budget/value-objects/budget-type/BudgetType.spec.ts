import { BudgetType, BudgetTypeEnum } from './BudgetType';

describe('BudgetType', () => {
  describe('create', () => {
    it('should create a personal budget type', () => {
      const budgetType = BudgetType.create(BudgetTypeEnum.PERSONAL);

      expect(budgetType.type).toBe(BudgetTypeEnum.PERSONAL);
      expect(budgetType.isPersonal()).toBe(true);
      expect(budgetType.isShared()).toBe(false);
    });

    it('should create a shared budget type', () => {
      const budgetType = BudgetType.create(BudgetTypeEnum.SHARED);

      expect(budgetType.type).toBe(BudgetTypeEnum.SHARED);
      expect(budgetType.isShared()).toBe(true);
      expect(budgetType.isPersonal()).toBe(false);
    });
  });

  describe('createPersonal', () => {
    it('should create a personal budget type', () => {
      const budgetType = BudgetType.createPersonal();

      expect(budgetType.type).toBe(BudgetTypeEnum.PERSONAL);
      expect(budgetType.isPersonal()).toBe(true);
    });
  });

  describe('createShared', () => {
    it('should create a shared budget type', () => {
      const budgetType = BudgetType.createShared();

      expect(budgetType.type).toBe(BudgetTypeEnum.SHARED);
      expect(budgetType.isShared()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for same budget types', () => {
      const budgetType1 = BudgetType.create(BudgetTypeEnum.PERSONAL);
      const budgetType2 = BudgetType.create(BudgetTypeEnum.PERSONAL);

      expect(budgetType1.equals(budgetType2)).toBe(true);
    });

    it('should return false for different budget types', () => {
      const budgetType1 = BudgetType.create(BudgetTypeEnum.PERSONAL);
      const budgetType2 = BudgetType.create(BudgetTypeEnum.SHARED);

      expect(budgetType1.equals(budgetType2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation for personal type', () => {
      const budgetType = BudgetType.createPersonal();

      expect(budgetType.toString()).toBe('PERSONAL');
    });

    it('should return string representation for shared type', () => {
      const budgetType = BudgetType.createShared();

      expect(budgetType.toString()).toBe('SHARED');
    });
  });
});

import { AccountType, AccountTypeEnum } from './AccountType';

describe('AccountType', () => {
  describe('create', () => {
    it('should create a valid account type for CHECKING_ACCOUNT', () => {
      const accountType = AccountType.create(AccountTypeEnum.CHECKING_ACCOUNT);

      expect(accountType.hasError).toBe(false);
      expect(accountType.value?.type).toBe(AccountTypeEnum.CHECKING_ACCOUNT);
    });

    it('should create a valid account type for SAVINGS_ACCOUNT', () => {
      const accountType = AccountType.create(AccountTypeEnum.SAVINGS_ACCOUNT);

      expect(accountType.hasError).toBe(false);
      expect(accountType.value?.type).toBe(AccountTypeEnum.SAVINGS_ACCOUNT);
    });

    it('should create a valid account type for PHYSICAL_WALLET', () => {
      const accountType = AccountType.create(AccountTypeEnum.PHYSICAL_WALLET);

      expect(accountType.hasError).toBe(false);
      expect(accountType.value?.type).toBe(AccountTypeEnum.PHYSICAL_WALLET);
    });

    it('should create a valid account type for DIGITAL_WALLET', () => {
      const accountType = AccountType.create(AccountTypeEnum.DIGITAL_WALLET);

      expect(accountType.hasError).toBe(false);
      expect(accountType.value?.type).toBe(AccountTypeEnum.DIGITAL_WALLET);
    });

    it('should create a valid account type for INVESTMENT_ACCOUNT', () => {
      const accountType = AccountType.create(
        AccountTypeEnum.INVESTMENT_ACCOUNT,
      );

      expect(accountType.hasError).toBe(false);
      expect(accountType.value?.type).toBe(AccountTypeEnum.INVESTMENT_ACCOUNT);
    });

    it('should create a valid account type for OTHER', () => {
      const accountType = AccountType.create(AccountTypeEnum.OTHER);

      expect(accountType.hasError).toBe(false);
      expect(accountType.value?.type).toBe(AccountTypeEnum.OTHER);
    });

    it('should return error for invalid account type', () => {
      const accountType = AccountType.create('INVALID_TYPE' as AccountTypeEnum);

      expect(accountType.hasError).toBe(true);
      expect(accountType.errors[0].message).toBe(
        'O tipo de conta informado é inválido.',
      );
    });

    it('should return error for undefined account type', () => {
      const accountType = AccountType.create(
        undefined as unknown as AccountTypeEnum,
      );

      expect(accountType.hasError).toBe(true);
      expect(accountType.errors[0].message).toBe(
        'O tipo de conta informado é inválido.',
      );
    });
  });

  describe('equals', () => {
    it('should return true for equal account types', () => {
      const accountType1 = AccountType.create(AccountTypeEnum.CHECKING_ACCOUNT);
      const accountType2 = AccountType.create(AccountTypeEnum.CHECKING_ACCOUNT);

      expect(accountType1.equals(accountType2)).toBe(true);
    });

    it('should return false for different account types', () => {
      const accountType1 = AccountType.create(AccountTypeEnum.CHECKING_ACCOUNT);
      const accountType2 = AccountType.create(AccountTypeEnum.SAVINGS_ACCOUNT);

      expect(accountType1.equals(accountType2)).toBe(false);
    });

    it('should return false when comparing with invalid account type', () => {
      const validAccountType = AccountType.create(
        AccountTypeEnum.CHECKING_ACCOUNT,
      );
      const invalidAccountType = AccountType.create(
        'INVALID' as AccountTypeEnum,
      );

      expect(validAccountType.equals(invalidAccountType)).toBe(false);
    });
  });
});

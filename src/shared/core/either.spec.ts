import { Either } from './either';

describe('Either', () => {
  describe('success', () => {
    it('should create successful Either with data', () => {
      const result = Either.success('test data');

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data).toBe('test data');
      expect(result.errors).toEqual([]);
    });

    it('should handle boolean false as valid data', () => {
      const result = Either.success(false);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should handle null as valid data', () => {
      const result = Either.success(null);

      expect(result.hasData).toBe(true);
      expect(result.data).toBe(null);
    });

    it('should handle undefined as valid data', () => {
      const result = Either.success(undefined);

      expect(result.hasData).toBe(false);
      expect(result.hasError).toBe(false);
      expect(result.data).toBe(null);
    });

    it('should handle empty string as valid data', () => {
      const result = Either.success('');

      expect(result.hasData).toBe(true);
      expect(result.data).toBe('');
    });

    it('should handle zero as valid data', () => {
      const result = Either.success(0);

      expect(result.hasData).toBe(true);
      expect(result.data).toBe(0);
    });

    it('should handle object data correctly', () => {
      const data = { id: '123', name: 'Test' };
      const result = Either.success(data);

      expect(result.hasData).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should handle array data correctly', () => {
      const data = [1, 2, 3];
      const result = Either.success(data);

      expect(result.hasData).toBe(true);
      expect(result.data).toEqual(data);
    });
  });

  describe('error', () => {
    it('should create Either with single error', () => {
      const error = new Error('test error');
      const result = Either.error(error);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toEqual([error]);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle custom error objects', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('custom error');
      const result = Either.error(error);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(CustomError);
      expect(result.errors[0].message).toBe('custom error');
    });
  });

  describe('errors', () => {
    it('should create Either with multiple errors', () => {
      const errors = [new Error('error1'), new Error('error2')];
      const result = Either.errors(errors);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toEqual(errors);
      expect(result.errors).toHaveLength(2);
    });

    it('should handle empty errors array', () => {
      const result = Either.errors([]);

      expect(result.hasError).toBe(false);
      expect(result.hasData).toBe(false);
      expect(result.errors).toEqual([]);
    });

    it('should handle single error in array', () => {
      const error = new Error('single error');
      const result = Either.errors([error]);

      expect(result.hasError).toBe(true);
      expect(result.errors).toEqual([error]);
      expect(result.errors).toHaveLength(1);
    });

    it('should preserve error order', () => {
      const error1 = new Error('first error');
      const error2 = new Error('second error');
      const error3 = new Error('third error');
      const result = Either.errors([error1, error2, error3]);

      expect(result.errors[0]).toBe(error1);
      expect(result.errors[1]).toBe(error2);
      expect(result.errors[2]).toBe(error3);
    });
  });

  describe('addError', () => {
    it('should add error to existing errors', () => {
      const initialError = new Error('initial error');
      const result = Either.error(initialError);

      const newError = new Error('new error');
      result.addError(newError);

      expect(result.hasError).toBe(true);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain(initialError);
      expect(result.errors).toContain(newError);
    });

    it('should add error to successful Either making it error', () => {
      const result = Either.success('test data');

      const error = new Error('new error');
      result.addError(error);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors).toContain(error);
      expect(result.data).toBeNull();
    });
  });

  describe('addManyErrors', () => {
    it('should add multiple errors to existing errors', () => {
      const initialError = new Error('initial error');
      const result = Either.error(initialError);

      const newErrors = [new Error('error1'), new Error('error2')];
      result.addManyErrors(newErrors);

      expect(result.hasError).toBe(true);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain(initialError);
      expect(result.errors).toContain(newErrors[0]);
      expect(result.errors).toContain(newErrors[1]);
    });

    it('should add multiple errors to successful Either', () => {
      const result = Either.success('test data');

      const errors = [new Error('error1'), new Error('error2')];
      result.addManyErrors(errors);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors).toEqual(errors);
    });

    it('should handle empty array without changes', () => {
      const result = Either.success('test data');
      result.addManyErrors([]);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data).toBe('test data');
    });
  });

  describe('type safety', () => {
    it('should maintain type safety for success data', () => {
      interface TestData {
        id: string;
        value: number;
      }

      const data: TestData = { id: '123', value: 42 };
      const result = Either.success<Error, TestData>(data);

      if (result.hasData) {
        expect(result.data!.id).toBe('123');
        expect(result.data!.value).toBe(42);
      }
    });

    it('should maintain type safety for error types', () => {
      class CustomError extends Error {
        public code: number;
        constructor(message: string, code: number) {
          super(message);
          this.code = code;
        }
      }

      const error = new CustomError('test', 404);
      const result = Either.error<CustomError, string>(error);

      if (result.hasError) {
        expect(result.errors[0].code).toBe(404);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very large error arrays', () => {
      const errors = Array.from(
        { length: 1000 },
        (_, i) => new Error(`Error ${i}`),
      );
      const result = Either.errors(errors);

      expect(result.hasError).toBe(true);
      expect(result.errors).toHaveLength(1000);
      expect(result.errors[0].message).toBe('Error 0');
      expect(result.errors[999].message).toBe('Error 999');
    });

    it('should handle nested object mutations', () => {
      const data = { nested: { value: 'original' } };
      const result = Either.success(data);

      data.nested.value = 'modified';

      if (result.data) {
        expect(result.data.nested.value).toBe('modified');
      }
    });
  });
});

export type ApplicationErrorObj = {
  error: string;
  field: string;
  message: string;
  extras?: unknown;
};

export abstract class ApplicationError extends Error {
  protected fieldName: string = '';
  protected extras: unknown = null;

  get errorObj(): ApplicationErrorObj {
    return {
      error: this.name,
      field: this.fieldName,
      message: this.message,
      extras: this.extras,
    };
  }
}

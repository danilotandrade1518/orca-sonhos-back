export enum EnvelopeStatusEnum {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ARCHIVED = 'ARCHIVED',
}

export class EnvelopeStatus {
  private constructor(private readonly _value: EnvelopeStatusEnum) {}

  get value(): EnvelopeStatusEnum {
    return this._value;
  }

  isActive(): boolean {
    return this._value === EnvelopeStatusEnum.ACTIVE;
  }

  isPaused(): boolean {
    return this._value === EnvelopeStatusEnum.PAUSED;
  }

  isArchived(): boolean {
    return this._value === EnvelopeStatusEnum.ARCHIVED;
  }

  static create(status: EnvelopeStatusEnum): EnvelopeStatus {
    return new EnvelopeStatus(status);
  }
}

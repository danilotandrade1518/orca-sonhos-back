export enum BudgetTypeEnum {
  PERSONAL = 'PERSONAL',
  SHARED = 'SHARED',
}

export interface CreateBudgetTypeDTO {
  type: BudgetTypeEnum;
}

export class BudgetType {
  get type(): BudgetTypeEnum {
    return this._type;
  }

  private constructor(private _type: BudgetTypeEnum) {
    this._type = _type;
  }

  isShared(): boolean {
    return this._type === BudgetTypeEnum.SHARED;
  }

  isPersonal(): boolean {
    return this._type === BudgetTypeEnum.PERSONAL;
  }

  equals(other: BudgetType): boolean {
    return this._type === other._type;
  }

  toString(): string {
    return this._type;
  }

  static create(type: BudgetTypeEnum): BudgetType {
    return new BudgetType(type);
  }

  static createPersonal(): BudgetType {
    return new BudgetType(BudgetTypeEnum.PERSONAL);
  }

  static createShared(): BudgetType {
    return new BudgetType(BudgetTypeEnum.SHARED);
  }
}

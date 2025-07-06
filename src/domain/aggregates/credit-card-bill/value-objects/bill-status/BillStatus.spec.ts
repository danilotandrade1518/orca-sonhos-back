import { BillStatus, BillStatusEnum } from './BillStatus';

describe('BillStatus', () => {
  it('deve criar um status válido - OPEN', () => {
    const vo = BillStatus.create(BillStatusEnum.OPEN);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.status).toBe(BillStatusEnum.OPEN);
  });

  it('deve criar um status válido - CLOSED', () => {
    const vo = BillStatus.create(BillStatusEnum.CLOSED);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.status).toBe(BillStatusEnum.CLOSED);
  });

  it('deve criar um status válido - PAID', () => {
    const vo = BillStatus.create(BillStatusEnum.PAID);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.status).toBe(BillStatusEnum.PAID);
  });

  it('deve criar um status válido - OVERDUE', () => {
    const vo = BillStatus.create(BillStatusEnum.OVERDUE);
    expect(vo.hasError).toBe(false);
    expect(vo.value?.status).toBe(BillStatusEnum.OVERDUE);
  });

  it('deve considerar iguais status com o mesmo valor', () => {
    const vo1 = BillStatus.create(BillStatusEnum.OPEN);
    const vo2 = BillStatus.create(BillStatusEnum.OPEN);

    expect(vo1.equals(vo2)).toBe(true);
  });

  it('deve considerar diferentes status com valores diferentes', () => {
    const vo1 = BillStatus.create(BillStatusEnum.OPEN);
    const vo2 = BillStatus.create(BillStatusEnum.CLOSED);

    expect(vo1.equals(vo2)).toBe(false);
  });
});

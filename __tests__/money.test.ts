import { parseAmountToMinorUnits } from '../lib/money';

describe('parseAmountToMinorUnits', () => {
  it('converts standard decimal amount to minor units', () => {
    expect(parseAmountToMinorUnits('10.00')).toBe(1000);
    expect(parseAmountToMinorUnits('10.05')).toBe(1005);
    expect(parseAmountToMinorUnits('0.99')).toBe(99);
  });

  it('handles European/LatAm comma separators correctly', () => {
    expect(parseAmountToMinorUnits('10,01')).toBe(1001);
    expect(parseAmountToMinorUnits('0,50')).toBe(50);
  });

  it('handles whole numbers without decimals', () => {
    expect(parseAmountToMinorUnits('10')).toBe(1000);
    expect(parseAmountToMinorUnits('5')).toBe(500);
  });

  it('handles empty and invalid inputs gracefully', () => {
    expect(parseAmountToMinorUnits('')).toBe(0);
    expect(parseAmountToMinorUnits('   ')).toBe(0);
    expect(parseAmountToMinorUnits('abc')).toBe(0);
  });
});

export function formatMoney(minorUnits: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(minorUnits / 100);
}

export function parseAmountToMinorUnits(input: string): number {
  if (!input.trim()) return 0;
  // Normalize comma to dot for European/LatAm keyboards
  const normalizedStr = input.trim().replace(',', '.');
  const num = parseFloat(normalizedStr);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

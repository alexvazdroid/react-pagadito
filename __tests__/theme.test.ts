import { colors, statusColor } from '@/lib/theme';

describe('statusColor', () => {
  it('maps AUTHORIZED to the success color', () => {
    expect(statusColor('AUTHORIZED')).toBe(colors.success);
  });

  it('falls back to the muted color for unknown statuses', () => {
    expect(statusColor('SOMETHING_ELSE')).toBe(colors.textMuted);
  });
});

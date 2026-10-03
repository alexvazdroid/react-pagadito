export const colors = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#E3E5EC',
  text: '#161821',
  textMuted: '#6B7080',
  primary: '#3853F4',
  primaryText: '#FFFFFF',
  success: '#1AA160',
  danger: '#D8493A',
  warning: '#B8790C',
  inactive: '#9AA0AE',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

export function statusColor(status: string): string {
  switch (status) {
    case 'AUTHORIZED':
    case 'ACTIVE':
      return colors.success;
    case 'DECLINED':
    case 'INACTIVE':
      return colors.danger;
    case 'PENDING':
      return colors.warning;
    default:
      return colors.textMuted;
  }
}

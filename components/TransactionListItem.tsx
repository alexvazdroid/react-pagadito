import { StyleSheet, Text, View } from 'react-native';
import { Transaction } from '@/lib/types';
import { colors, radius, spacing, statusColor } from '@/lib/theme';
import { formatMoney } from '@/lib/money';

const BRAND_LABEL: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  unknown: 'Card',
};

export function TransactionListItem({ transaction }: { transaction: Transaction }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.description} numberOfLines={1}>{transaction.description}</Text>
        <Text style={styles.amount}>{formatMoney(transaction.amount, transaction.currency)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>
          {BRAND_LABEL[transaction.card.brand] || 'Card'} •••• {transaction.card.last4}
        </Text>
        <Text style={[styles.status, { color: statusColor(transaction.status) }]}>
          {transaction.status}
        </Text>
      </View>
      <Text style={styles.date}>{new Date(transaction.createdAt).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
  date: {
    fontSize: 11,
    color: colors.inactive,
    marginTop: spacing.xs,
  },
});

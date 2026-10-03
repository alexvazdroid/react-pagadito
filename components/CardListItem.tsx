import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/lib/types';
import { colors, radius, spacing, statusColor } from '@/lib/theme';

const BRAND_LABEL: Record<Card['brand'], string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  unknown: 'Card',
};

export function CardListItem({ card, onPress }: { card: Card; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.row}>
        <Text style={styles.brand}>{BRAND_LABEL[card.brand]}</Text>
        <Text style={styles.last4}>•••• {card.last4}</Text>
      </View>
      <Text style={styles.holder}>{card.cardholderName}</Text>
      <View style={styles.row}>
        <Text style={styles.meta}>
          Exp {String(card.expirationMonth).padStart(2, '0')}/{card.expirationYear}
        </Text>
        <Text style={[styles.status, { color: statusColor(card.status) }]}>{card.status}</Text>
      </View>
    </Pressable>
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
  pressed: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  last4: {
    fontSize: 15,
    color: colors.textMuted,
  },
  holder: {
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.xs,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});

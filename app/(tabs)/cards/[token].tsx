import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { getCard } from '@/lib/api';
import { colors, radius, spacing, statusColor } from '@/lib/theme';
import { Card } from '@/lib/types';

export default function CardDetailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCard = useCallback(() => {
    setError(null);
    setCard(null);
    let isMounted = true;
    
    getCard(token)
      .then((data) => {
        if (isMounted) setCard(data);
      })
      .catch(() => {
        if (isMounted) setError('Could not load this card.');
      });
      
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    return fetchCard();
  }, [fetchCard]);

  if (error) {
    return <ErrorView message={error} onRetry={fetchCard} />;
  }

  if (!card) {
    return <LoadingView label="Loading card…" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>{card.brand.toUpperCase()}</Text>
        <Text style={styles.number}>•••• •••• •••• {card.last4}</Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Cardholder</Text>
            <Text style={styles.value}>{card.cardholderName}</Text>
          </View>
          <View>
            <Text style={styles.label}>Expires</Text>
            <Text style={styles.value}>
              {String(card.expirationMonth).padStart(2, '0')}/{card.expirationYear}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Token</Text>
        <Text style={styles.detailValue}>{card.token}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Status</Text>
        <Text style={[styles.detailValue, { color: statusColor(card.status) }]}>{card.status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  brand: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  number: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: '#B8BCC8',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

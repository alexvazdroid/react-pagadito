import { useEffect, useState, useRef } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { authorizeTransaction, getCards } from '@/lib/api';
import { colors, radius, spacing, statusColor } from '@/lib/theme';
import { Card } from '@/lib/types';
import { parseAmountToMinorUnits } from '@/lib/money';

function isExpirationInPast(month: number, year: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year < currentYear || (year === currentYear && month < currentMonth);
}

const generateIdempotencyKey = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export default function AuthorizeTransactionScreen() {
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCardToken, setSelectedCardToken] = useState<string | null>(null);
  
  const attemptRef = useRef({
    description: '',
    amount: 0,
    cardToken: '',
    key: generateIdempotencyKey()
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    getCards().then(data => {
      setCards(data);
      if (data.length > 0) {
        // Select first valid card
        const validCard = data.find(c => !isExpirationInPast(c.expirationMonth, c.expirationYear));
        if (validCard) setSelectedCardToken(validCard.token);
      }
    }).finally(() => setLoadingCards(false));
  }, []);

  const handleSubmit = async () => {
    setFormError(null);

    const minorAmount = parseAmountToMinorUnits(amountStr);

    if (!description.trim() || minorAmount <= 0 || !selectedCardToken) {
      setFormError('Please enter a valid description, amount, and select a card.');
      return;
    }

    if (
      attemptRef.current.description !== description.trim() ||
      attemptRef.current.amount !== minorAmount ||
      attemptRef.current.cardToken !== selectedCardToken
    ) {
      attemptRef.current = {
        description: description.trim(),
        amount: minorAmount,
        cardToken: selectedCardToken,
        key: generateIdempotencyKey()
      };
    }

    const idempotencyKey = attemptRef.current.key;

    setSubmitting(true);
    try {
      const tx = await authorizeTransaction({
        description: description.trim(),
        amount: minorAmount,
        currency: 'USD',
        cardToken: selectedCardToken,
      }, idempotencyKey);

      if (tx.status === 'DECLINED') {
        Alert.alert('Payment Declined', 'The gateway declined this payment. Please try a different card.');
      } else {
        Alert.alert('Transaction Processed', `Status: ${tx.status}`, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (err) {
      setFormError('We could not send the transaction. There was a gateway error or invalid request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Coffee, groceries, etc."
      />
      <TextField
        label="Amount (USD)"
        value={amountStr}
        onChangeText={setAmountStr}
        placeholder="10.00"
        keyboardType="decimal-pad"
      />
      
      <Text style={styles.pickerLabel}>Select card</Text>
      {loadingCards ? (
        <Text style={styles.loadingText}>Loading cards...</Text>
      ) : cards.length === 0 ? (
        <Text style={styles.emptyText}>No cards available.</Text>
      ) : (
        cards.map(card => {
          const expired = isExpirationInPast(card.expirationMonth, card.expirationYear);
          const selected = selectedCardToken === card.token;
          
          return (
            <Pressable
              key={card.token}
              disabled={expired || submitting}
              onPress={() => setSelectedCardToken(card.token)}
              style={[
                styles.cardOption,
                selected && styles.cardOptionSelected,
                expired && styles.cardOptionExpired,
              ]}
            >
              <View style={styles.cardInfo}>
                <Text style={[styles.cardBrand, expired && styles.textExpired]}>
                  {card.brand.toUpperCase()}
                </Text>
                <Text style={[styles.cardLast4, expired && styles.textExpired]}>
                  •••• {card.last4}
                </Text>
              </View>
              {expired ? (
                <Text style={styles.expiredLabel}>Expired</Text>
              ) : selected ? (
                <View style={styles.radioSelected} />
              ) : (
                <View style={styles.radio} />
              )}
            </Pressable>
          );
        })
      )}

      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      
      <PrimaryButton 
        label="Authorize transaction" 
        onPress={handleSubmit} 
        loading={submitting} 
        disabled={loadingCards || cards.length === 0}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  cardOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EAEAFF',
  },
  cardOptionExpired: {
    opacity: 0.5,
    backgroundColor: '#F0F0F0',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardBrand: {
    fontWeight: '700',
    color: colors.text,
  },
  cardLast4: {
    color: colors.textMuted,
  },
  textExpired: {
    color: '#888',
  },
  expiredLabel: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
  },
  submitBtn: {
    marginTop: spacing.xl,
  },
});

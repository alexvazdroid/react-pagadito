import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { createCard } from '@/lib/api';
import { rememberLastCardToken } from '@/lib/storage';
import { colors, spacing } from '@/lib/theme';

function isExpirationInPast(month: number, year: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return year < currentYear || (year === currentYear && month < currentMonth);
}

export default function AddCardScreen() {
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationMonth, setExpirationMonth] = useState('');
  const [expirationYear, setExpirationYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);

    const month = Number(expirationMonth);
    const year = Number(expirationYear);

    if (!cardholderName.trim() || cardNumber.trim().length < 12 || cvv.trim().length < 3) {
      setFormError('Fill in all fields with valid card details.');
      return;
    }

    if (!month || month < 1 || month > 12 || !year) {
      setFormError('Enter a valid expiration month and year.');
      return;
    }

    if (isExpirationInPast(month, year)) {
      setFormError('This card is expired.');
      return;
    }

    setSubmitting(true);
    try {
      const card = await createCard({
        cardholderName: cardholderName.trim(),
        cardNumber: cardNumber.trim(),
        expirationMonth: month,
        expirationYear: year,
        cvv: cvv.trim(),
      });

      await rememberLastCardToken(card.token);

      setCardholderName('');
      setCardNumber('');
      setExpirationMonth('');
      setExpirationYear('');
      setCvv('');

      router.back();
    } catch (err) {
      setFormError('Could not add this card. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextField
        label="Cardholder name"
        value={cardholderName}
        onChangeText={setCardholderName}
        placeholder="John Doe"
        autoCapitalize="words"
      />
      <TextField
        label="Card number"
        value={cardNumber}
        onChangeText={setCardNumber}
        placeholder="4111 1111 1111 1111"
        keyboardType="number-pad"
        maxLength={19}
      />
      <TextField
        label="Expiration month"
        value={expirationMonth}
        onChangeText={setExpirationMonth}
        placeholder="MM"
        keyboardType="number-pad"
        maxLength={2}
      />
      <TextField
        label="Expiration year"
        value={expirationYear}
        onChangeText={setExpirationYear}
        placeholder="YYYY"
        keyboardType="number-pad"
        maxLength={4}
      />
      <TextField
        label="CVV"
        value={cvv}
        onChangeText={setCvv}
        placeholder="123"
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
      />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <PrimaryButton label="Add card" onPress={handleSubmit} loading={submitting} />
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
  error: {
    color: colors.danger,
    marginBottom: spacing.md,
  },
});

import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';

export default function TransactionsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Transactions' }} />
      <Stack.Screen name="authorize" options={{ title: 'New transaction', presentation: 'modal' }} />
    </Stack>
  );
}

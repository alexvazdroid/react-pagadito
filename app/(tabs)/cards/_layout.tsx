import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';

export default function CardsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Cards' }} />
      <Stack.Screen name="add" options={{ title: 'Add card', presentation: 'modal' }} />
      <Stack.Screen name="[token]" options={{ title: 'Card details' }} />
    </Stack>
  );
}

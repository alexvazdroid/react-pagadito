import * as SecureStore from 'expo-secure-store';

const LAST_CARD_TOKEN_KEY = 'paytest.lastCardToken';

export async function rememberLastCardToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(LAST_CARD_TOKEN_KEY, token);
}

export async function getLastCardToken(): Promise<string | null> {
  return SecureStore.getItemAsync(LAST_CARD_TOKEN_KEY);
}

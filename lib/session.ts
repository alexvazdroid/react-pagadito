import { useSyncExternalStore } from 'react';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'paytest.sessionToken';
let currentToken: string | null = null;
const listeners = new Set<() => void>();

export function getSessionToken(): string | null {
  return currentToken;
}

export function setSessionToken(token: string | null): void {
  currentToken = token;
  if (token) {
    SecureStore.setItemAsync(SESSION_KEY, token).catch(console.error);
  } else {
    SecureStore.deleteItemAsync(SESSION_KEY).catch(console.error);
  }
  listeners.forEach((listener) => listener());
}

export async function hydrateSession(): Promise<void> {
  try {
    const token = await SecureStore.getItemAsync(SESSION_KEY);
    if (token) {
      currentToken = token;
      listeners.forEach((listener) => listener());
    }
  } catch (err) {
    console.error('Failed to hydrate session token', err);
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSessionToken(): string | null {
  return useSyncExternalStore(subscribe, getSessionToken);
}

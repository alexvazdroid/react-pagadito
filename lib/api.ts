import { API_URL } from './env';
import { getSessionToken, setSessionToken } from './session';
import { AuthResponse, Card, LoginInput, NewCardInput, SignupInput, User, Transaction, AuthorizeTransactionInput } from './types';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getSessionToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      setSessionToken(null);
    }
    throw new Error('Request failed');
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export function getCards(): Promise<Card[]> {
  return apiFetch<Card[]>('/cards');
}

export function getCard(token: string): Promise<Card> {
  return apiFetch<Card>(`/cards/${token}`);
}

export function createCard(input: NewCardInput): Promise<Card> {
  return apiFetch<Card>('/cards', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function signup(input: SignupInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMe(): Promise<User> {
  return apiFetch<User>('/me');
}

export function deleteMe(): Promise<void> {
  return apiFetch<void>('/me', {
    method: 'DELETE',
  });
}

export function getTransactions(): Promise<Transaction[]> {
  return apiFetch<Transaction[]>('/transactions');
}

export function authorizeTransaction(input: AuthorizeTransactionInput, idempotencyKey: string): Promise<Transaction> {
  return apiFetch<Transaction>('/transactions/authorize', {
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(input),
  });
}


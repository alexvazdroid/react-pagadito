export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
export type CardStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SignupInput {
  email: string;
  password?: string;
}

export interface LoginInput {
  email: string;
  password?: string;
}

export interface Card {
  token: string;
  brand: CardBrand;
  last4: string;
  expirationMonth: number;
  expirationYear: number;
  cardholderName: string;
  status: CardStatus;
  createdAt: string;
}

export type TransactionStatus = 'AUTHORIZED' | 'DECLINED' | 'PENDING';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  card: {
    token: string;
    brand: CardBrand;
    last4: string;
  };
  createdAt: string;
}

export interface NewCardInput {
  cardholderName: string;
  cardNumber: string;
  expirationMonth: number;
  expirationYear: number;
  cvv: string;
}

export interface AuthorizeTransactionInput {
  description: string;
  amount: number;
  currency: string;
  cardToken: string;
}

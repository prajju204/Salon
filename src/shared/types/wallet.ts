export interface WalletCard {
  id: string;
  number: string;
  expiry: string;
  cvv: string;
  name: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'rupay';
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  serviceName: string;
  stylistName: string;
  date: string; // YYYY-MM-DD
  amount: number;
  status: 'Paid' | 'Refunded' | 'Pending';
  receiptNumber: string;
  paymentMethod: string;
}

export interface GiftCardRedemption {
  id: string;
  code: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
}

import { WalletCard, Transaction, GiftCardRedemption } from "@/shared/types/wallet";

export const mockCards: WalletCard[] = [
  {
    id: 'wc1',
    number: '•••• •••• •••• 4242',
    expiry: '12/28',
    cvv: '123',
    name: 'JAMES MERCER',
    brand: 'visa',
    isDefault: true
  },
  {
    id: 'wc2',
    number: '•••• •••• •••• 9876',
    expiry: '06/29',
    cvv: '999',
    name: 'JAMES MERCER',
    brand: 'mastercard',
    isDefault: false
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    serviceName: 'Executive Scissor Cut',
    stylistName: 'Alexander Wright',
    date: '2026-07-01',
    amount: 1200,
    status: 'Paid',
    receiptNumber: 'REC-20260701-492',
    paymentMethod: 'Visa (•••• 4242)'
  },
  {
    id: 'tx2',
    serviceName: 'Royal Beard Detail',
    stylistName: 'Marcus Sterling',
    date: '2026-06-20',
    amount: 800,
    status: 'Paid',
    receiptNumber: 'REC-20260620-811',
    paymentMethod: 'Mastercard (•••• 9876)'
  },
  {
    id: 'tx3',
    serviceName: 'Gold Brightening Facial',
    stylistName: 'Jordan Vance',
    date: '2026-06-10',
    amount: 2200,
    status: 'Paid',
    receiptNumber: 'REC-20260610-093',
    paymentMethod: 'Gift Card Balance'
  },
  {
    id: 'tx4',
    serviceName: 'The Luxe Ritual Package',
    stylistName: 'David Croft',
    date: '2026-05-25',
    amount: 3200,
    status: 'Refunded',
    receiptNumber: 'REC-20260525-671',
    paymentMethod: 'Visa (•••• 4242)'
  },
  {
    id: 'tx5',
    serviceName: 'Classic Buzz Cut',
    stylistName: 'Alexander Wright',
    date: '2026-05-15',
    amount: 600,
    status: 'Paid',
    receiptNumber: 'REC-20260515-338',
    paymentMethod: 'Visa (•••• 4242)'
  }
];

export const mockGiftCardRedemptions: GiftCardRedemption[] = [
  {
    id: 'gr1',
    code: 'LUXE500',
    amount: 500,
    date: '2026-06-15',
    description: 'Welcome Loyalty Reward'
  },
  {
    id: 'gr2',
    code: 'GROOM2000',
    amount: 2000,
    date: '2026-05-10',
    description: 'Birthday Gift Card Voucher'
  }
];

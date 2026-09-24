export type RecordStatus = 'ACTIVE' | 'INACTIVE';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface DashboardStats {
  contributionTotal: number;
  auctionTotal: number;
  auctionWinningTotal: number;
  totalCollected: number;
  expenseTotal: number;
  balance: number;
  auctionCount: number;
  collectionVsExpenses: ChartPoint[];
  contributionsOverTime: ChartPoint[];
  expensesByCategory: ChartPoint[];
  auctionCollections: ChartPoint[];
  recentContributions: Contribution[];
  recentExpenses: Expense[];
  recentAuctions: Auction[];
}

export interface PublicContribution {
  name: string;
  flatNumber?: string;
  amount: number;
}

export interface Contribution {
  id: number;
  contributorName: string;
  flatNumber?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paidTo?: string;
  paymentProofPath?: string;
  paymentDate: string;
  status: PaymentStatus;
  occasion?: string;
  notes?: string;
  createdBy?: string;
}

export interface Category {
  id: number;
  name: string;
  status: RecordStatus;
}

export interface Expense {
  id: number;
  categoryId?: number;
  category?: string;
  description: string;
  amount: number;
  expenseDate: string;
  paidBy?: string;
  receiptUrl?: string;
  occasion?: string;
  notes?: string;
  status: RecordStatus;
  createdBy?: string;
}

/** One receipt recorded against an auction, oldest first in the auction's ledger. */
export interface AuctionPayment {
  id: number;
  auctionId: number;
  amount: number;
  paymentDate: string;
  /** Cash, UPI, bank transfer or other; older receipts may not carry it. */
  paymentMethod?: PaymentMethod;
  /** Screenshot uploaded as proof of this receipt, when the committee attached one. */
  paymentProofPath?: string;
  /** Who received the money on a cash receipt; UPI and bank transfers keep a proof instead. */
  paidTo?: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface Auction {
  id: number;
  auctionName: string;
  winner: string;
  flatNumber?: string;
  winningAmount: number;
  amountPaid: number;
  balance: number;
  auctionDate: string;
  paymentStatus: PaymentStatus;
  occasion?: string;
  /** Receipts recorded by the committee for this auction; the auction list returns the full ledger. */
  payments?: AuctionPayment[];
  notes?: string;
  status: RecordStatus;
}

export type Token = {
  userId: string;
  balance: number;
  transactions: Transaction[];
};

export type Transaction = {
    id: string;
    amount: number;
    type: 'credit' | 'debit';
    timestamp: Date;
}

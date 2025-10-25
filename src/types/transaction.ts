export interface Transaction {
  uid: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  direction: string;
  category?: string;
  timestamp?: string;
}
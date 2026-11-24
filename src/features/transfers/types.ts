export type TransferListItem = {
  _id: string;
  amount: number;
  transferDate: string;
  description: string;
  fromAccountName: string;
  toAccountName: string;
  /** Resolved currency of the two accounts (they are always the same). */
  currency: string;
};

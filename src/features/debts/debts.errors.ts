import { AppError, NotFoundError } from "@/server/kernel/errors";

export class DebtNotFoundError extends NotFoundError {
  constructor() {
    super("debtNotFound", "Debt not found");
    this.name = "DebtNotFoundError";
  }
}

export class DebtAccountNotFoundError extends NotFoundError {
  constructor() {
    super("accountNotFound", "Selected account not found");
    this.name = "DebtAccountNotFoundError";
  }
}

export class DebtOverpaymentError extends AppError {
  readonly remainingAmount: number;
  constructor(remainingAmount: number) {
    super(
      "debtOverpayment",
      `Payment exceeds remaining debt of ${remainingAmount}`,
      400,
      { remainingAmount },
    );
    this.name = "DebtOverpaymentError";
    this.remainingAmount = remainingAmount;
  }
}

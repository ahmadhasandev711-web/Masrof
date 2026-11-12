import { AppError, InvalidReferenceError } from "@/server/kernel/errors";

export class InvalidInvoiceReferenceError extends InvalidReferenceError {
  constructor(code: string) {
    super(code, code);
    this.name = "InvalidInvoiceReferenceError";
  }
}

/** Invoice `paid` must come from {@link recordInvoicePayment}, not a status toggle. */
export class InvoicePaidStatusNotAllowedError extends AppError {
  constructor() {
    super(
      "useRecordPayment",
      "Invoice paid status must be recorded via a payment allocation",
      400,
    );
    this.name = "InvoicePaidStatusNotAllowedError";
  }
}

export class InvalidPaymentReferenceError extends InvalidReferenceError {
  constructor(code: string) {
    super(code, code);
    this.name = "InvalidPaymentReferenceError";
  }
}

export class InvoiceOverpaymentError extends AppError {
  readonly remainingAmount: number;
  constructor(remainingAmount: number) {
    super(
      "invoiceOverpayment",
      `Payment exceeds invoice remaining balance of ${remainingAmount}`,
      400,
      { remainingAmount },
    );
    this.name = "InvoiceOverpaymentError";
    this.remainingAmount = remainingAmount;
  }
}

export class InvoiceCancelledError extends AppError {
  constructor() {
    super("invoiceCancelledCannotPay", "Cannot record payment on a cancelled invoice", 400);
    this.name = "InvoiceCancelledError";
  }
}

export class AccountCurrencyMismatchError extends AppError {
  constructor() {
    super("accountCurrencyMismatch", "Account currency does not match invoice currency", 400);
    this.name = "AccountCurrencyMismatchError";
  }
}

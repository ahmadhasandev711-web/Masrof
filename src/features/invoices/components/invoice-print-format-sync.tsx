"use client";

import { useEffect } from "react";
import type { InvoicePrintFormat } from "@/features/invoices/constants";

/** Syncs print format to <html> for @page CSS (A4 vs thermal). */
export function InvoicePrintFormatSync({ format }: { format: InvoicePrintFormat }) {
  useEffect(() => {
    document.documentElement.dataset.invoiceFormat = format;
    return () => {
      delete document.documentElement.dataset.invoiceFormat;
    };
  }, [format]);

  return null;
}

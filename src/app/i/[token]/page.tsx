import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicInvoiceByToken } from "@/features/invoices/public-invoice-data";
import { PublicInvoiceDocument } from "@/features/invoices/components/public-invoice-document";
import "@/app/print/invoice/invoice-print.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const invoice = await getPublicInvoiceByToken(token);
  if (!invoice) {
    return { title: "فاتورة غير موجودة" };
  }

  return {
    title: `فاتورة ${invoice.invoiceNumber} — ${invoice.businessName}`,
    description: `فاتورة صادرة من ${invoice.businessName} للعميل ${invoice.client.name}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await getPublicInvoiceByToken(token);

  if (!invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-100 py-6 sm:py-12">
      <PublicInvoiceDocument invoice={invoice} />
    </main>
  );
}

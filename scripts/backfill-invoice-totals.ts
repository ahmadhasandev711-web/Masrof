/**
 * Backfill stored invoice money totals for legacy documents.
 *
 * Dry-run by default. Pass --apply to write.
 *
 * Usage:
 *   npm run backfill:invoice-totals
 *   npm run backfill:invoice-totals -- --apply
 */
import { connectToDatabase } from "@/lib/db/mongoose";
import { InvoiceModel } from "@/models/invoice";
import { resolveInvoiceTotals } from "@/features/invoices/invoice-line-math";

async function main() {
  const apply = process.argv.includes("--apply");
  await connectToDatabase();

  const filter = {
    $or: [
      { subtotal: { $exists: false } },
      { total: { $exists: false } },
      { subtotal: null },
      { total: null },
    ],
  };

  const cursor = InvoiceModel.find(filter).cursor();
  let scanned = 0;
  let wouldUpdate = 0;
  let updated = 0;

  for await (const doc of cursor) {
    scanned += 1;
    const money = resolveInvoiceTotals({
      items: doc.items.map((item) => ({
        description: item.description,
        amount: item.amount,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subtotal: doc.subtotal,
      taxEnabled: doc.taxEnabled,
      taxRatePercent: doc.taxRatePercent,
      taxAmount: doc.taxAmount,
      total: doc.total,
    });

    wouldUpdate += 1;

    if (apply) {
      await InvoiceModel.updateOne(
        { _id: doc._id },
        {
          $set: {
            subtotal: money.subtotal,
            taxEnabled: money.taxEnabled,
            taxRatePercent: money.taxRatePercent,
            taxAmount: money.taxAmount,
            total: money.total,
          },
        },
      );
      updated += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        scanned,
        wouldUpdate,
        updated,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

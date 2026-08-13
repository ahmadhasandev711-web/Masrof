/**
 * Product positioning decision for soft-launch → growth.
 * Keep finance tracking broad, but lead with freelancers / invoices
 * until 10–20 tester conversations confirm (or reject) a narrower B2B wedge.
 */
export const PRODUCT_POSITIONING = {
  phase: "soft_launch_test",
  primaryAudience: "freelancers_and_small_agencies_in_egypt",
  leadWedge: "arabic_invoices_clients_expense_tracking",
  keepBroaderFinance: true,
  onlinePayments: "manual_admin_until_paymob",
  revisitPivotAfter: "10_20_tester_interviews_post_vercel",
} as const;

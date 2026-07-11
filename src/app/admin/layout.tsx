import { ClientRedirect } from "@/components/client-redirect";
import { getCurrentSession } from "@/features/auth/session";
import { isAdminEmail } from "@/lib/admin";
import { repairAdminDisplayName } from "@/lib/admin/repair-display-name";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session) {
    return <ClientRedirect href="/login" />;
  }

  if (!isAdminEmail(session.user.email)) {
    return <ClientRedirect href="/dashboard" />;
  }

  const userName =
    (await repairAdminDisplayName(session.user.email, session.user.name)) ??
    session.user.name ??
    session.user.email;

  return <AdminShell userName={userName}>{children}</AdminShell>;
}

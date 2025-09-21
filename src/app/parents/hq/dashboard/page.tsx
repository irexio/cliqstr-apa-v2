export const dynamic = 'force-dynamic';

/**
 * 🔐 APA-HARDENED COMPONENT: Parents HQ Dashboard
 * 
 * Purpose:
 *   - Dashboard view for parents after plan selection
 *   - Handles approval token for child signup completion
 *   - Shows parent management interface
 */

import ParentsHQContent from '@/components/parents/ParentsHQContent';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { enforceAPA } from '@/lib/auth/enforceAPA';

export default async function ParentsHQDashboard({
  searchParams,
}: {
  searchParams: { approvalToken?: string };
}) {
  const user = await getCurrentUser();
  enforceAPA(user, searchParams.approvalToken);
  return <ParentsHQContent />;
}

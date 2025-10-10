export const dynamic = 'force-dynamic';

/**
 * 🔐 PARENT HQ: Smart Router
 *
 * Purpose:
 *   - Determines the correct parent experience based on context
 *   - Routes to appropriate sub-pages for setup vs manage modes
 */

import { redirect } from 'next/navigation';

interface ParentsHQPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ParentsHQPage({ searchParams }: ParentsHQPageProps) {
  const approvalToken = searchParams?.approvalToken as string || null;
  const inviteCode = searchParams?.inviteCode as string || null;

  // If there's an approval token or invite code, this is setup mode
  if (approvalToken || inviteCode) {
    redirect(`/parents/hq/setup?${new URLSearchParams({
      ...(approvalToken && { approvalToken }),
      ...(inviteCode && { inviteCode })
    }).toString()}`);
  }

  // Otherwise, this is manage mode (existing children or first-time setup)
  redirect('/parents/hq/manage');
}

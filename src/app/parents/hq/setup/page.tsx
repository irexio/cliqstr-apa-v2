export const dynamic = 'force-dynamic';

/**
 * 🔐 PARENT HQ: Setup Mode
 *
 * Purpose:
 *   - Handles new child creation and invite approval
 *   - Focused UI for setting up children without manage mode distractions
 */

import ParentDashboard from '@/components/parents/ParentDashboard';

interface ParentsHQSetupPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ParentsHQSetupPage({ searchParams }: ParentsHQSetupPageProps) {
  const approvalToken = searchParams?.approvalToken as string || null;
  const inviteCode = searchParams?.inviteCode as string || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <ParentDashboard
          context="setup"
          approvalToken={approvalToken}
          inviteCode={inviteCode}
        />
      </div>
    </div>
  );
}

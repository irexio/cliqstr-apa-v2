export const dynamic = 'force-dynamic';

/**
 * 🔐 UNIFIED PARENT HQ: Single Entry Point
 * 
 * Purpose:
 *   - Unified entry point for all parent-related functionality
 *   - Handles both child invite approval (setup mode) and ongoing child management (manage mode)
 *   - Uses context prop to switch between modes seamlessly
 */

import ParentDashboard from '@/components/parents/ParentDashboard';

interface ParentsHQPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ParentsHQPage({ searchParams }: ParentsHQPageProps) {
  const approvalToken = searchParams?.approvalToken as string || null;
  const inviteCode = searchParams?.inviteCode as string || null;
  
  // Determine context: setup mode if any approval token/code present, otherwise manage mode
  const context = (approvalToken || inviteCode) ? 'setup' : 'manage';
  
  // For backward compatibility, convert inviteCode to approvalToken
  const token = approvalToken || inviteCode;

  return (
    <ParentDashboard 
      context={context as 'setup' | 'manage'} 
      approvalToken={token}
      inviteCode={inviteCode}
    />
  );
}
